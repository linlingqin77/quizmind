import { SetMetadata } from '@nestjs/common';

// 熔断器配置
export interface CircuitBreakerConfig {
  failureThreshold?: number;      // 失败阈值
  successThreshold?: number;      // 成功阈值
  timeout?: number;               // 超时时间
  resetTimeout?: number;          // 重置超时
  fallbackMethod?: string;        // 降级方法名
}

export const CIRCUIT_BREAKER_KEY = 'circuit_breaker';

/**
 * @CircuitBreaker - 熔断器
 * 类似 Spring Cloud Circuit Breaker / Resilience4j
 * 
 * @example
 * ```typescript
 * @CircuitBreaker({
 *   failureThreshold: 5,
 *   timeout: 3000,
 *   fallbackMethod: 'fallbackGetUser'
 * })
 * async getUser(id: string) {
 *   return this.externalAPI.getUser(id);
 * }
 * 
 * async fallbackGetUser(id: string) {
 *   return this.cache.get(`user:${id}`);
 * }
 * ```
 */
export const CircuitBreaker = (config: CircuitBreakerConfig = {}) =>
  SetMetadata(CIRCUIT_BREAKER_KEY, {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 3000,
    resetTimeout: 60000,
    ...config,
  });
