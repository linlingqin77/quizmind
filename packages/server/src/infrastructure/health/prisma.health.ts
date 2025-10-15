import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../../core/database/prisma.service';

/**
 * Prisma 健康检查指示器
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 执行简单查询测试数据库连接
      await this.prismaService.$queryRaw`SELECT 1`;
      
      return this.getStatus(key, true, {
        message: 'Database is healthy',
      });
    } catch (error) {
      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }
}
