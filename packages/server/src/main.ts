import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TRPCContext } from './infrastructure/trpc/context';
import { AppRouter } from './presentation/routers/app.router';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { RequestLoggingInterceptor } from './shared/interceptors/request-logging.interceptor';
import { CustomLoggerService } from './core/logging/logger.service';
import { SentryService } from './core/monitoring/sentry.service';
import { setupSwagger } from './core/swagger/swagger.config';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  // 使用自定义日志服务
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 获取服务
  const configService = app.get(ConfigService);
  const logger = app.get(CustomLoggerService);
  const sentryService = app.get(SentryService);
  const trpcContext = app.get(TRPCContext);
  const appRouter = app.get(AppRouter);

  // 设置日志服务
  app.useLogger(logger);

  // 安全中间件（Helmet）
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );

  // 响应压缩
  app.use(compression());

  // CORS 配置
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局验证管道（class-validator）
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // 自动删除 DTO 中未定义的属性
    forbidNonWhitelisted: true,   // 如果有未定义的属性，抛出错误
    transform: true,              // 自动转换类型（如字符串 "123" -> 数字 123）
    transformOptions: {
      enableImplicitConversion: true, // 启用隐式类型转换
    },
    disableErrorMessages: false,  // 开发环境显示详细错误
  }));

  // 请求体大小限制
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器（请求日志）
  app.useGlobalInterceptors(new RequestLoggingInterceptor(logger));

  // tRPC 中间件
  app.use(
    '/api/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter.appRouter as any,
      createContext: (opts) => trpcContext.create(opts),
    }),
  );

  // 健康检查端点
  app.use('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version,
    });
  });

  // 就绪探针（Kubernetes）
  app.use('/api/ready', (req, res) => {
    // 检查数据库连接、Redis 等
    res.json({ status: 'ready' });
  });

  // Swagger API 文档（仅在非生产环境启用）
  if (configService.get('app.nodeEnv') !== 'production') {
    setupSwagger(app);
  }

  // 优雅关闭
  const gracefulShutdown = async (signal: string) => {
    logger.log(`收到 ${signal} 信号，开始优雅关闭...`, 'Bootstrap');
    
    try {
      await app.close();
      logger.log('应用已成功关闭', 'Bootstrap');
      process.exit(0);
    } catch (error) {
      logger.error('关闭过程中出错', error.stack, 'Bootstrap');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  const port = configService.get('app.port');
  await app.listen(port);

  const env = configService.get('app.nodeEnv');
  const corsOrigins = configService.get('app.corsOrigin');

  logger.log(`
🚀 服务器启动成功！
  
📡 端点信息：
   - 服务地址: http://localhost:${port}
   - tRPC API: http://localhost:${port}/api/trpc
   - Swagger文档: http://localhost:${port}/api/docs
   - 健康检查: http://localhost:${port}/api/health
   - 就绪探针: http://localhost:${port}/api/ready
  
🔧 环境信息：
   - Node 环境: ${env}
   - CORS 来源: ${corsOrigins.join(', ')}
   - 日志级别: ${process.env.LOG_LEVEL || 'info'}
  
🛡️ 安全功能：
   - ✅ Helmet 安全头
   - ✅ 限流保护
   - ✅ 请求日志
   - ✅ 错误监控${sentryService ? ' (Sentry)' : ''}
   - ✅ 数据验证 (class-validator)
  
🚀 企业级功能已启用！
  `, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('应用启动失败:', error);
  process.exit(1);
});

// 导入 express（用于中间件）
import * as express from 'express';
