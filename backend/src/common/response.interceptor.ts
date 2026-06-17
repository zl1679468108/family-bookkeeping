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
  const pad = (n: number) => String(n).padStart(2, '0');
  const padMs = (n: number) => String(n).padStart(3, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = padMs(date.getMilliseconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

function convertTimeFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => convertTimeFields(item));
  if (typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isTimeField(key, value)) {
      result[key] = toBeijingTime(value);
    } else if (
      typeof value === 'string' &&
      (ISO_DATE_REGEX.test(value) || TIMESTAMPTZ_REGEX.test(value))
    ) {
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
