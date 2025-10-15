import { Module, Global } from '@nestjs/common';
import { PrometheusMetricsService } from './prometheus-metrics.service';

@Global()
@Module({
  providers: [PrometheusMetricsService],
  exports: [PrometheusMetricsService],
})
export class PrometheusMetricsModule {}

