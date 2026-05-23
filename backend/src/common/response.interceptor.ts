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
          data: data as T,
        };
      }),
    );
  }
}
