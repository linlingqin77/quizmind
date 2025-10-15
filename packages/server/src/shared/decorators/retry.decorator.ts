import { SetMetadata } from '@nestjs/common';

// 重试配置
export interface RetryConfig {
  maxAttempts?: number;     // 最大重试次数
  delay?: number;           // 重试延迟（毫秒）
  backoff?: number;         // 退避乘数
  retryOn?: (error: any) => boolean;  // 重试条件
}

export const RETRY_KEY = 'retry';

/**
 * @Retry - 自动重试
 * 类似 Spring @Retryable
 * 
 * @example
 * ```typescript
 * @Retry({ 
 *   maxAttempts: 3, 
 *   delay: 1000, 
 *   backoff: 2 
 * })
 * async callExternalAPI() {
 *   return axios.get('https://api.example.com/data');
 * }
 * ```
 */
export const Retry = (config: RetryConfig = {}) =>
  SetMetadata(RETRY_KEY, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 1,
    retryOn: (error: any) => error.status >= 500,
    ...config,
  });
