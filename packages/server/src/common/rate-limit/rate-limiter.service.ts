import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

interface RateLimitRule {
  key: string;
  limit: number;        // 限流阈值
  window: number;       // 时间窗口（秒）
  block?: number;       // 阻塞时间（秒），超过限流后阻塞多久
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * 限流服务
 * 类似 Spring Cloud Alibaba Sentinel
 * 基于 Redis 实现分布式限流
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * 滑动窗口限流算法
   */
  async slidingWindow(rule: RateLimitRule): Promise<RateLimitResult> {
    const { key, limit, window } = rule;
    const now = Date.now();
    const windowStart = now - window * 1000;
    
    const redisKey = `rate_limit:sliding:${key}`;

    try {
      // 使用 Lua 脚本保证原子性
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local windowStart = now - window * 1000
        
        -- 移除过期的记录
        redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
        
        -- 获取当前窗口内的请求数
        local current = redis.call('ZCARD', key)
        
        if current < limit then
          -- 添加当前请求
          redis.call('ZADD', key, now, now)
          redis.call('EXPIRE', key, window)
          return {1, limit - current - 1, window}
        else
          -- 获取最早的请求时间
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local resetAt = math.ceil((tonumber(oldest[2]) + window * 1000 - now) / 1000)
          return {0, 0, resetAt}
        end
      `;

      const result: any = await this.redis.eval(
        script,
        1,
        redisKey,
        now,
        window,
        limit,
      );

      const allowed = result[0] === 1;
      const remaining = result[1];
      const resetAt = result[2];

      return {
        allowed,
        remaining,
        resetAt,
        retryAfter: allowed ? undefined : resetAt,
      };
    } catch (error) {
      this.logger.error(`Sliding window rate limit error: ${error.message}`);
      // 失败时默认允许请求
      return {
        allowed: true,
        remaining: limit,
        resetAt: window,
      };
    }
  }

  /**
   * 令牌桶算法
   */
  async tokenBucket(rule: RateLimitRule): Promise<RateLimitResult> {
    const { key, limit, window } = rule;
    const redisKey = `rate_limit:token:${key}`;
    
    const refillRate = limit / window; // 每秒补充的令牌数
    const capacity = limit;
    
    try {
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local capacity = tonumber(ARGV[2])
        local refillRate = tonumber(ARGV[3])
        
        local bucket = redis.call('HGETALL', key)
        local tokens = capacity
        local lastRefill = now
        
        if #bucket > 0 then
          for i = 1, #bucket, 2 do
            if bucket[i] == 'tokens' then
              tokens = tonumber(bucket[i + 1])
            elseif bucket[i] == 'lastRefill' then
              lastRefill = tonumber(bucket[i + 1])
            end
          end
          
          -- 补充令牌
          local elapsed = (now - lastRefill) / 1000
          tokens = math.min(capacity, tokens + elapsed * refillRate)
        end
        
        if tokens >= 1 then
          tokens = tokens - 1
          redis.call('HSET', key, 'tokens', tokens, 'lastRefill', now)
          redis.call('EXPIRE', key, 60)
          return {1, math.floor(tokens), 0}
        else
          local waitTime = math.ceil((1 - tokens) / refillRate)
          return {0, 0, waitTime}
        end
      `;

      const result: any = await this.redis.eval(
        script,
        1,
        redisKey,
        Date.now(),
        capacity,
        refillRate,
      );

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetAt: result[2],
        retryAfter: result[0] === 1 ? undefined : result[2],
      };
    } catch (error) {
      this.logger.error(`Token bucket rate limit error: ${error.message}`);
      return {
        allowed: true,
        remaining: limit,
        resetAt: 0,
      };
    }
  }

  /**
   * 固定窗口限流（最简单）
   */
  async fixedWindow(rule: RateLimitRule): Promise<RateLimitResult> {
    const { key, limit, window } = rule;
    const redisKey = `rate_limit:fixed:${key}`;
    
    try {
      const current = await this.redis.incr(redisKey);
      
      if (current === 1) {
        await this.redis.expire(redisKey, window);
      }
      
      const ttl = await this.redis.ttl(redisKey);
      
      if (current <= limit) {
        return {
          allowed: true,
          remaining: limit - current,
          resetAt: ttl,
        };
      } else {
        return {
          allowed: false,
          remaining: 0,
          resetAt: ttl,
          retryAfter: ttl,
        };
      }
    } catch (error) {
      this.logger.error(`Fixed window rate limit error: ${error.message}`);
      return {
        allowed: true,
        remaining: limit,
        resetAt: window,
      };
    }
  }

  /**
   * 热点参数限流
   * 类似 Sentinel 的热点参数限流
   */
  async hotParamLimit(
    resource: string,
    param: string,
    limit: number,
    window: number,
  ): Promise<RateLimitResult> {
    const key = `${resource}:${param}`;
    return this.slidingWindow({ key, limit, window });
  }

  /**
   * 系统自适应限流
   * 根据系统负载动态调整限流阈值
   */
  async adaptiveLimit(
    key: string,
    baseLimit: number,
    window: number,
  ): Promise<RateLimitResult> {
    // 获取系统负载
    const load = await this.getSystemLoad();
    
    // 根据负载调整限流阈值
    let adjustedLimit = baseLimit;
    
    if (load > 0.8) {
      adjustedLimit = Math.floor(baseLimit * 0.5); // 高负载时减半
    } else if (load > 0.6) {
      adjustedLimit = Math.floor(baseLimit * 0.7);
    }
    
    this.logger.debug(`Adaptive limit: ${adjustedLimit} (load: ${load})`);
    
    return this.slidingWindow({
      key,
      limit: adjustedLimit,
      window,
    });
  }

  /**
   * 获取系统负载（简化版）
   */
  private async getSystemLoad(): Promise<number> {
    try {
      const memoryUsage = process.memoryUsage();
      const used = memoryUsage.heapUsed;
      const total = memoryUsage.heapTotal;
      return used / total;
    } catch {
      return 0;5;
    }
  }

  /**
   * 黑名单限流
   */
  async isBlacklisted(key: string): Promise<boolean> {
    const blacklistKey = `rate_limit:blacklist:${key}`;
    const exists = await this.redis.exists(blacklistKey);
    return exists === 1;
  }

  /**
   * 添加到黑名单
   */
  async addToBlacklist(key: string, duration: number = 3600): Promise<void> {
    const blacklistKey = `rate_limit:blacklist:${key}`;
    await this.redis.setex(blacklistKey, duration, '1');
    this.logger.warn(`Added to blacklist: ${key} for ${duration}s`);
  }

  /**
   * 从黑名单移除
   */
  async removeFromBlacklist(key: string): Promise<void> {
    const blacklistKey = `rate_limit:blacklist:${key}`;
    await this.redis.del(blacklistKey);
    this.logger.log(`Removed from blacklist: ${key}`);
  }

  /**
   * 获取限流统计
   */
  async getStats(key: string): Promise<any> {
    const patterns = [
      `rate_limit:sliding:${key}`,
      `rate_limit:token:${key}`,
      `rate_limit:fixed:${key}`,
    ];
    
    const stats = {};
    
    for (const pattern of patterns) {
      const value = await this.redis.get(pattern);
      if (value) {
        stats[pattern] = value;
      }
    }
    
    return stats;
  }
}

