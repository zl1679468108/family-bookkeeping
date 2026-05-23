import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // 设置全局路由前缀
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 获取端口配置
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  
  await app.listen(port);
  console.log(`应用已启动，监听端口: ${port}`);
}

bootstrap();
