import { SetMetadata } from '@nestjs/common';

// 限流配置
export interface RateLimitConfig {
  limit?: number;          // 限制次数
  ttl?: number;           // 时间窗口（秒）
  keyPrefix?: string;     // 键前缀
  message?: string;       // 错误消息
}

export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * @RateLimit - 接口限流
 * 类似 Spring Cloud Gateway RateLimiter
 * 
 * @example
 * ```typescript
 * @RateLimit({ limit: 10, ttl: 60 })  // 1分钟内最多10次
 * async sendSMS(phone: string) {
 *   return this.smsService.send(phone);
 * }
 * ```
 */
export const RateLimit = (config: RateLimitConfig = {}) =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit: 100,
    ttl: 60,
    keyPrefix: 'rate_limit',
    message: '请求过于频繁，请稍后再试',
    ...config,
  });
