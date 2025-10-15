import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../../core/logging/logger.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * 请求日志拦截器
 * 记录所有 HTTP 请求的详细信息
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, ip } = request;
    
    // 生成请求 ID
    const requestId = headers['x-request-id'] || uuidv4();
    request.requestId = requestId;
    
    // 设置请求 ID 到日志上下文
    this.logger.setRequestId(requestId);

    const now = Date.now();
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id;

    // 记录请求开始
    this.logger.logWithMeta(
      'info',
      `📥 Incoming Request: ${method} ${url}`,
      {
        requestId,
        method,
        url,
        body: this.sanitizeBody(body),
        ip,
        userAgent,
        userId,
      },
      'HTTP',
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - now;

          // 记录请求成功
          this.logger.logRequest(method, url, statusCode, duration, userId);

          // 性能警告（超过 1 秒）
          if (duration > 1000) {
            this.logger.warn(
              `⚠️ Slow Request: ${method} ${url} took ${duration}ms`,
              'Performance',
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - now;
          const statusCode = error.status || 500;

          // 记录请求失败
          this.logger.error(
            `❌ Request Failed: ${method} ${url}`,
            error.stack,
            'HTTP',
          );

          this.logger.logWithMeta(
            'error',
            error.message,
            {
              requestId,
              method,
              url,
              statusCode,
              duration,
              userId,
            },
            'HTTP',
          );
        },
      }),
    );
  }

  /**
   * 清理敏感信息
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}

