import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * 数据库模块
 * 全局模块，在整个应用中可用
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

