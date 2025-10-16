import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * 限流配置
 * 防止暴力攻击和 DDoS
 */
export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      // 全局限流：60秒内最多100个请求
      ttl: 60000, // 毫秒
      limit: 100,
    },
  ],
};

/**
 * 特定端点的限流配置
 */
export const customThrottlerConfig = {
  // 登录接口：60秒内最多5次
  login: {
    ttl: 60,
    limit: 5,
  },
  
  // 注册接口：60秒内最多3次
  register: {
    ttl: 60,
    limit: 3,
  },
  
  // 密码重置：60秒内最多3次
  resetPassword: {
    ttl: 60,
    limit: 3,
  },
  
  // 文件上传：60秒内最多10次
  upload: {
    ttl: 60,
    limit: 10,
  },
  
  // AI 接口：60秒内最多20次
  ai: {
    ttl: 60,
    limit: 20,
  },
};

/**
 * IP 白名单
 */
export const ipWhitelist = [
  '127.0.0.1',
  '::1',
  // 添加信任的 IP
];

/**
 * 自定义限流装饰器
 */
import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export const CustomThrottle = (ttl: number, limit: number) =>
  SetMetadata(THROTTLE_KEY, { ttl, limit });

