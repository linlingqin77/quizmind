import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../infrastructure/metrics/metrics.service';

/**
 * 指标收集拦截器
 * 自动记录 HTTP 请求指标
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          this.metricsService.recordHttpRequest(
            request.method,
            this.sanitizePath(request.route?.path || request.url),
            response.statusCode,
            duration,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          this.metricsService.recordHttpRequest(
            request.method,
            this.sanitizePath(request.route?.path || request.url),
            error.status || 500,
            duration,
          );
        },
      }),
    );
  }

  /**
   * 清理路径，移除动态参数
   */
  private sanitizePath(path: string): string {
    return path.replace(/\/[0-9a-f-]{20,}/gi, '/:id');
  }
}
