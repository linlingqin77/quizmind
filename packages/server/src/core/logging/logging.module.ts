import { Global, Module } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';

/**
 * 日志模块
 * 全局模块，在整个应用中提供日志服务
 */
@Global()
@Module({
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class LoggingModule {}

