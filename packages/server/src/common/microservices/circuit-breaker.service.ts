import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  name?: string;
}

/**
 * 熔断器服务
 * 类似 Spring Cloud Circuit Breaker / Resilience4j
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * 创建或获取熔断器
   */
  getBreaker<T = any>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreaker<T> {
    if (this.breakers.has(name)) {
      return this.breakers.get(name);
    }

    const breaker = new CircuitBreaker(action, {
      timeout: options.timeout || 3000,
      errorThresholdPercentage: options.errorThresholdPercentage || 50,
      resetTimeout: options.resetTimeout || 30000,
      rollingCountTimeout: options.rollingCountTimeout || 10000,
      rollingCountBuckets: options.rollingCountBuckets || 10,
      name: options.name || name,
    });

    // 监听事件
    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker ${name} opened`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker ${name} half-opened`);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker ${name} closed`);
    });

    breaker.on('fallback', (result) => {
      this.logger.warn(`Circuit breaker ${name} fallback executed`);
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * 执行带熔断器的操作
   */
  async execute<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    fallback?: (...args: any[]) => T | Promise<T>,
    options?: CircuitBreakerOptions,
  ): Promise<T> {
    const breaker = this.getBreaker(name, action, options);

    if (fallback) {
      breaker.fallback(fallback);
    }

    return breaker.fire();
  }

  /**
   * 获取熔断器统计信息
   */
  getStats(name: string) {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return null;
    }

    return {
      name: breaker.name,
      opened: breaker.opened,
      halfOpen: breaker.halfOpen,
      closed: breaker.closed,
      stats: breaker.stats,
    };
  }

  /**
   * 获取所有熔断器状态
   */
  getAllStats() {
    const stats = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = this.getStats(name);
    });
    return stats;
  }

  /**
   * 手动打开熔断器
   */
  open(name: string) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.open();
      this.logger.warn(`Manually opened circuit breaker: ${name}`);
    }
  }

  /**
   * 手动关闭熔断器
   */
  close(name: string) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.close();
      this.logger.log(`Manually closed circuit breaker: ${name}`);
    }
  }
}
