import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})$/;
const TIMESTAMPTZ_REGEX =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:[+-]\d{2})$/;
const TIME_KEYS = new Set([
  'created_at',
  'updated_at',
  'expires_at',
  'used_at',
  'joined_at',
  'start_time',
  'end_time',
  'login_time',
  'last_login',
  'deleted_at',
  'date',
  'time',
  'datetime',
  'timestamp',
  'last_active',
  'last_used',
  'expire_at',
  'issued_at',
]);

function toBeijingTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  // 输出 ISO 8601 格式北京时间，保证前端 new Date() 可解析
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });
  const parts = formatter.format(date).replace(' ', 'T');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${parts}.${ms}+08:00`;
}

// T-M4: 顶层时间字段集合（仅对这些字段转换，避免深拷贝大 payload）
const TOP_LEVEL_TIME_KEYS = new Set([
  'created_at',
  'updated_at',
  'expires_at',
  'used_at',
  'joined_at',
  'last_login',
  'deleted_at',
  'last_active',
  'last_used',
  'expire_at',
  'issued_at',
]);

// 嵌套数组中对象的常见时间字段
const NESTED_TIME_KEYS = new Set([
  'created_at',
  'updated_at',
  'date',
  'time',
  'datetime',
  'timestamp',
  'start_time',
  'end_time',
  'login_time',
]);

function isTimeField(key: string, value: unknown, topLevel: boolean): value is string {
  if (typeof value !== 'string') return false;
  const keys = topLevel ? TOP_LEVEL_TIME_KEYS : NESTED_TIME_KEYS;
  if (keys.has(key)) {
    return ISO_DATE_REGEX.test(value) || TIMESTAMPTZ_REGEX.test(value);
  }
  return false;
}

/**
 * 转换时间字段（T-M4: 避免深拷贝大 payload）
 * - 顶层对象：仅转换已知 TIME_KEYS 字段
 * - 数组元素：递归转换常见时间字段
 * - 其他对象：不递归，减少 O(n) 开销
 */
function convertTimeFields(obj: unknown, topLevel: boolean = true): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    // 数组元素（如交易列表）需要递归处理时间字段
    return obj.map((item) => convertTimeFields(item, false));
  }
  if (typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isTimeField(key, value, topLevel)) {
      result[key] = toBeijingTime(value);
    } else if (Array.isArray(value)) {
      // 数组字段（如 transactions 列表）递归处理
      result[key] = value.map((item) => convertTimeFields(item, false));
    } else if (typeof value === 'object' && value !== null) {
      // 嵌套对象不递归，避免 O(n) 深拷贝
      result[key] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const isBinaryResponse =
      response.headersSent ||
      response.getHeader('Content-Disposition') ||
      response.getHeader('Content-Type') === 'application/pdf' ||
      response.getHeader('Content-Type') ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (isBinaryResponse) {
      return next.handle() as Observable<SuccessResponse<T>>;
    }

    return next.handle().pipe(
      map((payload) => {
        if (payload === undefined) {
          return payload as unknown as SuccessResponse<T>;
        }

        const message =
          payload &&
          typeof payload === 'object' &&
          'message' in (payload as Record<string, unknown>)
            ? String((payload as Record<string, unknown>).message)
            : '请求成功';

        const data =
          payload &&
          typeof payload === 'object' &&
          'data' in (payload as Record<string, unknown>)
            ? (payload as Record<string, unknown>).data
            : payload;

        return {
          success: true,
          message,
          data: convertTimeFields(data) as T,
        };
      }),
    );
  }
}
