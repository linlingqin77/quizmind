import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../enterprise/audit/audit.service';

// 审计装饰器元数据键
export const AUDIT_KEY = 'audit';

// 审计配置接口
export interface AuditConfig {
  action: string;
  resource: string;
  skipResponse?: boolean;
}

/**
 * 审计装饰器
 */
export const Audit = (config: AuditConfig) =>
  Reflect.metadata(AUDIT_KEY, config);

/**
 * 审计拦截器
 * 自动记录标记了 @Audit 装饰器的操作
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip;
    const userAgent = request.get('User-Agent');

    return next.handle().pipe(
      tap({
        next: (response) => {
          // 成功时记录审计日志
          this.recordAudit(
            auditConfig,
            user,
            request,
            response,
            ipAddress,
            userAgent,
          );
        },
        error: (error) => {
          // 错误时也记录审计日志
          this.recordAudit(
            auditConfig,
            user,
            request,
            { error: error.message },
            ipAddress,
            userAgent,
          );
        },
      }),
    );
  }

  private async recordAudit(
    config: AuditConfig,
    user: any,
    request: any,
    response: any,
    ipAddress: string,
    userAgent: string,
  ) {
    try {
      const resourceId = this.extractResourceId(request, response);
      const details = this.buildDetails(config, request, response);

      await this.auditService.log({
        userId: user?.id,
        action: config.action,
        resource: config.resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      // 审计失败不应该影响主业务流程
      console.error('审计记录失败:', error);
    }
  }

  private extractResourceId(request: any, response: any): string | undefined {
    // 尝试从路径参数获取资源ID
    if (request.params?.id) {
      return request.params.id;
    }

    // 尝试从响应中获取ID
    if (response?.id) {
      return response.id;
    }

    // 尝试从请求体获取ID
    if (request.body?.id) {
      return request.body.id;
    }

    return undefined;
  }

  private buildDetails(
    config: AuditConfig,
    request: any,
    response: any,
  ): any {
    const details: any = {
      method: request.method,
      url: request.url,
    };

    // 添加请求参数（敏感信息过滤）
    if (request.params && Object.keys(request.params).length > 0) {
      details.params = request.params;
    }

    // 添加查询参数
    if (request.query && Object.keys(request.query).length > 0) {
      details.query = request.query;
    }

    // 添加请求体（过滤敏感信息）
    if (request.body && Object.keys(request.body).length > 0) {
      details.body = this.filterSensitiveData(request.body);
    }

    // 添加响应信息（如果配置允许）
    if (!config.skipResponse && response) {
      if (response.error) {
        details.error = response.error;
      } else if (typeof response === 'object') {
        details.response = this.filterSensitiveData(response);
      }
    }

    return details;
  }

  private filterSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
    ];

    const filtered = { ...data };

    for (const field of sensitiveFields) {
      if (field in filtered) {
        filtered[field] = '[FILTERED]';
      }
    }

    // 递归过滤嵌套对象
    for (const key in filtered) {
      if (typeof filtered[key] === 'object' && filtered[key] !== null) {
        filtered[key] = this.filterSensitiveData(filtered[key]);
      }
    }

    return filtered;
  }
}