import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';

/**
 * 健康检查控制器
 * 类似 Spring Boot Actuator 的 /actuator/health
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * 基础健康检查
   * GET /health
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // 数据库检查
      () => this.prisma.isHealthy('database'),
      
      // 内存检查 (堆内存使用不超过 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // RSS 内存检查 (不超过 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      
      // 磁盘空间检查 (可用空间不少于 1GB)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * 数据库健康检查
   * GET /health/db
   */
  @Get('db')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
    ]);
  }

  /**
   * 内存健康检查
   * GET /health/memory
   */
  @Get('memory')
  @HealthCheck()
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  /**
   * 磁盘健康检查
   * GET /health/disk
   */
  @Get('disk')
  @HealthCheck()
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * 就绪检查 (Readiness)
   * Kubernetes 就绪探针使用
   * GET /health/ready
   */
  @Get('ready')
  @HealthCheck()
  checkReady() {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
    ]);
  }

  /**
   * 存活检查 (Liveness)
   * Kubernetes 存活探针使用
   * GET /health/live
   */
  @Get('live')
  @HealthCheck()
  checkLive() {
    return {
      status: 'ok',
      info: { uptime: process.uptime() },
    };
  }
}
