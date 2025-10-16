import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * 应用指标控制器
 * 类似 Spring Boot Actuator 的 /actuator/metrics
 * 兼容 Prometheus 格式
 */
@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  /**
   * Prometheus 格式的指标
   * GET /metrics
   */
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return await this.metricsService.getPrometheusMetrics();
  }

  /**
   * JSON 格式的指标（便于查看）
   * GET /metrics/json
   */
  @Get('json')
  getMetricsJson() {
    return this.metricsService.getMetricsJson();
  }

  /**
   * 系统信息
   * GET /metrics/system
   */
  @Get('system')
  getSystemInfo() {
    return this.metricsService.getSystemInfo();
  }

  /**
   * HTTP 请求指标
   * GET /metrics/http
   */
  @Get('http')
  getHttpMetrics() {
    return this.metricsService.getHttpMetrics();
  }

  /**
   * 数据库指标
   * GET /metrics/database
   */
  @Get('database')
  getDatabaseMetrics() {
    return this.metricsService.getDatabaseMetrics();
  }

  /**
   * 业务指标
   * GET /metrics/business
   */
  @Get('business')
  getBusinessMetrics() {
    return this.metricsService.getBusinessMetrics();
  }
}
