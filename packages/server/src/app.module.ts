import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// import { CacheModule } from '@nestjs/cache-manager';
// import * as redisStore from 'cache-manager-redis-store';
import { DatabaseModule } from './core/database/database.module';
import { LoggingModule } from './core/logging/logging.module';
// Infrastructure
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { HealthModule } from './infrastructure/health/health.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';
import { TRPCModule } from './infrastructure/trpc/trpc.module';
import { MicroservicesModule } from './infrastructure/microservices/microservices.module';

// Features
import { AuthModule } from './features/auth/auth.module';

// Enterprise
import { AuditModule } from './enterprise/audit/audit.module';
import { PermissionsModule } from './enterprise/permissions/permissions.module';
import { EmailModule } from './enterprise/email/email.module';
import { UploadModule } from './enterprise/upload/upload.module';
import { QueueModule } from './enterprise/queue/queue.module';
import { PresentationModule } from './presentation/presentation.module';
import { SentryService } from './core/monitoring/sentry.service';
import { validateEnv } from './core/config/env.validation';
import { throttlerConfig } from './core/security/throttler.config';
import configuration from './core/config/configuration';

/**
 * 应用根模块 - 企业级版本
 * 集成日志、缓存、监控、安全等企业级功能
 */
@Module({
  imports: [
    // 配置模块（带验证）
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
      validate: validateEnv,
    }),

    // 日志模块
    LoggingModule,

    // 缓存模块（Redis） - 暂时禁用以便快速启动
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: () => ({
    //     store: redisStore,
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT) || 6379,
    //     password: process.env.REDIS_PASSWORD,
    //     db: parseInt(process.env.REDIS_DB) || 0,
    //     ttl: 300, // 默认 5 分钟
    //   }),
    // }),

    // 限流模块
    ThrottlerModule.forRoot(throttlerConfig),

    // 数据库模块
    DatabaseModule,
    
    // Infrastructure
    PrismaModule,
    HealthModule,
    MetricsModule,
    WebSocketModule,
    TRPCModule,
    MicroservicesModule,
    
    // Features
    AuthModule,
    
    // Enterprise
    AuditModule,
    PermissionsModule,
    EmailModule,
    UploadModule,
    QueueModule,
    
    // Presentation
    PresentationModule,
  ],
  providers: [SentryService],
})
export class AppModule {}
