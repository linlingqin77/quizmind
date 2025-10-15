import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrometheusMetricsService } from '../monitoring/prometheus-metrics.service';
import { ElasticsearchLoggerService } from '../logging/elasticsearch-logger.service';

/**
 * 指标收集拦截器
 * 自动记录HTTP请求和gRPC调用的指标
 * 类似 Spring Boot Actuator 的自动指标收集
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: PrometheusMetricsService,
    private readonly logger: ElasticsearchLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const contextType = context.getType();
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = (Date.now() - startTime) / 1000;
          
          if (contextType === 'http') {
            this.recordHttpMetrics(context, duration, 200);
          } else if (contextType === 'rpc') {
            this.recordGrpcMetrics(context, duration, true);
          }
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          
          if (contextType === 'http') {
            const statusCode = error.status || 500;
            this.recordHttpMetrics(context, duration, statusCode);
          } else if (contextType === 'rpc') {
            this.recordGrpcMetrics(context, duration, false, error.code);
          }
        },
      }),
    );
  }

  /**
   * 记录HTTP指标
   */
  private recordHttpMetrics(
    context: ExecutionContext,
    duration: number,
    statusCode: number,
  ) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const method = request.method;
    const path = request.route?.path || request.url;
    const requestSize = request.headers['content-length'] 
      ? parseInt(request.headers['content-length']) 
      : undefined;
    const responseSize = response.get('content-length')
      ? parseInt(response.get('content-length'))
      : undefined;
    
    // 记录Prometheus指标
    this.metricsService.recordHttpRequest(
      method,
      path,
      statusCode,
      duration,
      requestSize,
      responseSize,
    );
    
    // 记录日志
    this.logger.logHttpRequest(
      method,
      path,
      statusCode,
      duration * 1000,
      request.user?.id,
    );
  }

  /**
   * 记录gRPC指标
   */
  private recordGrpcMetrics(
    context: ExecutionContext,
    duration: number,
    success: boolean,
    errorCode?: string,
  ) {
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();
    
    // 从gRPC元数据提取服务和方法名
    const handler = context.getHandler().name;
    const className = context.getClass().name;
    
    const service = className.replace('GrpcController', '');
    const method = handler;
    const status = success ? 'OK' : 'ERROR';
    
    // 记录Prometheus指标
    this.metricsService.recordGrpcCall(
      service,
      method,
      status,
      duration,
      !success,
      errorCode,
    );
    
    // 记录日志
    this.logger.logGrpcCall(service, method, duration * 1000, success);
  }
}

