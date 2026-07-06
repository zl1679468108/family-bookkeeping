import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 增大请求体大小限制（支持 base64 图片上传）
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  // 启用 CORS — 支持从环境变量 CORS_ORIGINS 读取逗号分隔的域名列表
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const corsOriginsEnv = configService.get<string>('CORS_ORIGINS', '');
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : [
        frontendUrl,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
  app.enableCors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如 Postman、服务端调用）
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  });

  // 全局参数验证
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  // 设置全局路由前缀
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 启用关闭钩子（B-L2: Graceful Shutdown）
  app.enableShutdownHooks();

  // 健康检查端点（B-L1）
  app.getHttpAdapter().getInstance().get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // 获取端口配置
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`应用已启动，监听端口: ${port}`);
}

bootstrap();
