import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (response.headersSent) {
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
