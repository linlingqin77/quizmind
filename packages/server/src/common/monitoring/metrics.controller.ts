import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusMetricsService } from './prometheus-metrics.service';

/**
 * Prometheus指标暴露端点
 * 访问 /metrics 获取Prometheus格式的指标
 */
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: PrometheusMetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}

