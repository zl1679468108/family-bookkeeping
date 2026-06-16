import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  SupabaseNetworkError,
  SupabaseUnavailableError,
  TimeoutError,
} from '../supabase/supabase.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (response.headersSent) {
      return;
    }

    if (
      exception instanceof SupabaseUnavailableError ||
      exception instanceof SupabaseNetworkError ||
      exception instanceof TimeoutError
    ) {
      const status =
        exception instanceof SupabaseUnavailableError
          ? HttpStatus.SERVICE_UNAVAILABLE
          : exception instanceof TimeoutError
          ? HttpStatus.GATEWAY_TIMEOUT
          : HttpStatus.BAD_GATEWAY;
      const code =
        exception instanceof SupabaseUnavailableError
          ? 'SUPABASE_UNAVAILABLE'
          : exception instanceof TimeoutError
          ? 'SUPABASE_TIMEOUT'
          : 'SUPABASE_NETWORK_ERROR';

      this.logger.warn(
        `[${request?.method} ${request?.url}] ${exception.name}: ${exception.message}`,
      );

      response.status(status).json({
        success: false,
        message: exception.message || '数据库暂时不可用，请稍后重试',
        statusCode: status,
        code,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
      const payload =
        typeof errorResponse === 'string'
          ? { message: errorResponse }
          : (errorResponse as Record<string, unknown>);

      const messageSource = payload.message;
      const message = Array.isArray(messageSource)
        ? String(messageSource[0])
        : String(messageSource || exception.message || '请求失败');

      const code =
        typeof payload.error === 'string' ? payload.error : undefined;

      response.status(status).json({
        success: false,
        message,
        statusCode: status,
        code,
      });
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : '服务器内部错误';

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      code: 'InternalServerError',
    });
  }
}
