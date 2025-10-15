import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

/**
 * Sentry 错误监控服务
 * 自动捕获和上报错误
 */
@Injectable()
export class SentryService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get('SENTRY_DSN');
    
    if (!dsn) {
      console.warn('⚠️ Sentry DSN 未配置，错误监控已禁用');
      return;
    }

    Sentry.init({
      dsn,
      environment: this.configService.get('NODE_ENV'),
      tracesSampleRate: 1.0, // 性能监控采样率
      integrations: [
        // 自动追踪
        new Sentry.Integrations.Http({ tracing: true }),
      ],
      beforeSend(event, hint) {
        // 过滤敏感信息
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.['authorization'];
        }
        return event;
      },
    });

    console.log('✅ Sentry 错误监控已启用');
  }

  /**
   * 捕获异常
   */
  captureException(exception: Error, context?: string) {
    Sentry.captureException(exception, {
      tags: { context },
    });
  }

  /**
   * 捕获消息
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }

  /**
   * 设置用户上下文
   */
  setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * 设置标签
   */
  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  /**
   * 设置上下文
   */
  setContext(name: string, context: Record<string, any>) {
    Sentry.setContext(name, context);
  }

  /**
   * 添加面包屑（用于追踪事件流）
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * 开始事务（性能监控）
   */
  startTransaction(name: string, op: string) {
    return Sentry.startTransaction({ name, op });
  }
}

