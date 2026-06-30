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

function isTimeField(key: string, value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (TIME_KEYS.has(key)) {
    return ISO_DATE_REGEX.test(value) || TIMESTAMPTZ_REGEX.test(value);
  }
  return false;
}

function toBeijingTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  // 使用 Intl.DateTimeFormat 显式指定 Asia/Shanghai 时区（B-H7）
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });
  // 格式化后补齐毫秒部分
  const parts = formatter.format(date).replace(/\//g, '-');
  // Intl 输出格式类似 "2024-06-30 14:30:45"，补充 ".000" 毫秒
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${parts}.${ms}`;
}

function convertTimeFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => convertTimeFields(item));
  if (typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isTimeField(key, value)) {
      result[key] = toBeijingTime(value);
    } else {
      result[key] = convertTimeFields(value);
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
