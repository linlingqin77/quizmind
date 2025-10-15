import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';
import * as os from 'os';
import * as process from 'process';
import { PrismaService } from '../../core/database/prisma.service';

/**
 * 指标收集服务
 * 提供类似 Spring Boot Micrometer 的功能
 */
@Injectable()
export class MetricsService {
  // HTTP 请求计数器
  private httpRequestCounter: Counter;
  
  // HTTP 请求耗时直方图
  private httpRequestDuration: Histogram;
  
  // 内存使用量
  private memoryUsageGauge: Gauge;
  
  // 活跃用户数
  private activeUsersGauge: Gauge;
  
  // 业务指标
  private businessMetrics: Map<string, number> = new Map();

  constructor(private prisma: PrismaService) {
    this.initializeMetrics();
    this.startMetricsCollection();
  }

  /**
   * 初始化指标
   */
  private initializeMetrics() {
    // HTTP 请求总数
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    // HTTP 请求耗时
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // 内存使用量
    this.memoryUsageGauge = new Gauge({
      name: 'nodejs_memory_usage_bytes',
      help: 'Node.js memory usage in bytes',
      labelNames: ['type'],
    });

    // 活跃用户数
    this.activeUsersGauge = new Gauge({
      name: 'active_users_total',
      help: 'Total number of active users',
    });
  }

  /**
   * 开始定期收集指标
   */
  private startMetricsCollection() {
    // 每 10 秒更新一次内存指标
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsageGauge.set({ type: 'heap_used' }, memUsage.heapUsed);
      this.memoryUsageGauge.set({ type: 'heap_total' }, memUsage.heapTotal);
      this.memoryUsageGauge.set({ type: 'rss' }, memUsage.rss);
      this.memoryUsageGauge.set({ type: 'external' }, memUsage.external);
    }, 10000);

    // 每 30 秒更新一次活跃用户数
    setInterval(async () => {
      try {
        const activeUsers = await this.prisma.user.count({
          where: { isActive: true },
        });
        this.activeUsersGauge.set(activeUsers);
      } catch (error) {
        console.error('Failed to update active users metric:', error);
      }
    }, 30000);
  }

  /**
   * 记录 HTTP 请求
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number) {
    this.httpRequestCounter.inc({
      method,
      path,
      status: statusCode,
    });

    this.httpRequestDuration.observe(
      { method, path },
      duration / 1000, // 转换为秒
    );
  }

  /**
   * 记录业务指标
   */
  recordBusinessMetric(name: string, value: number) {
    this.businessMetrics.set(name, value);
  }

  /**
   * 增加业务计数器
   */
  incrementBusinessCounter(name: string, delta: number = 1) {
    const current = this.businessMetrics.get(name) || 0;
    this.businessMetrics.set(name, current + delta);
  }

  /**
   * 获取 Prometheus 格式的指标
   */
  getPrometheusMetrics(): string {
    return register.metrics();
  }

  /**
   * 获取 JSON 格式的指标
   */
  async getMetricsJson() {
    const metrics = await register.getMetricsAsJSON();
    return {
      timestamp: new Date().toISOString(),
      metrics,
    };
  }

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      },
    };
  }

  /**
   * 获取 HTTP 指标
   */
  async getHttpMetrics() {
    const httpMetrics = await register.getSingleMetric('http_requests_total');
    const durationMetrics = await register.getSingleMetric('http_request_duration_seconds');

    return {
      requests: httpMetrics ? await httpMetrics.get() : null,
      duration: durationMetrics ? await durationMetrics.get() : null,
    };
  }

  /**
   * 获取数据库指标
   */
  async getDatabaseMetrics() {
    try {
      const [userCount, examCount, questionCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.exam.count(),
        this.prisma.question.count(),
      ]);

      return {
        totalUsers: userCount,
        totalExams: examCount,
        totalQuestions: questionCount,
        connectionStatus: 'healthy',
      };
    } catch (error) {
      return {
        connectionStatus: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * 获取业务指标
   */
  getBusinessMetrics() {
    const metrics: Record<string, number> = {};
    this.businessMetrics.forEach((value, key) => {
      metrics[key] = value;
    });

    return {
      timestamp: new Date().toISOString(),
      metrics,
    };
  }
}
