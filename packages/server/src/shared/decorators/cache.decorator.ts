import { SetMetadata } from '@nestjs/common';

// 缓存配置接口
export interface CacheConfig {
  key?: string;           // 缓存键
  ttl?: number;          // 过期时间（秒）
  condition?: string;     // 缓存条件
}

export const CACHEABLE_KEY = 'cacheable';
export const CACHE_EVICT_KEY = 'cache_evict';
export const CACHE_PUT_KEY = 'cache_put';

/**
 * @Cacheable - 缓存查询结果
 * 类似 Spring @Cacheable
 * 
 * @example
 * ```typescript
 * @Cacheable({ key: 'user', ttl: 300 })
 * async getUserById(id: string) {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 * ```
 */
export const Cacheable = (config: CacheConfig = {}) =>
  SetMetadata(CACHEABLE_KEY, config);

/**
 * @CacheEvict - 清除缓存
 * 类似 Spring @CacheEvict
 * 
 * @example
 * ```typescript
 * @CacheEvict({ key: 'users', allEntries: true })
 * async deleteUser(id: string) {
 *   return this.prisma.user.delete({ where: { id } });
 * }
 * ```
 */
export const CacheEvict = (config: CacheConfig & { allEntries?: boolean } = {}) =>
  SetMetadata(CACHE_EVICT_KEY, config);

/**
 * @CachePut - 更新缓存
 * 类似 Spring @CachePut
 * 
 * @example
 * ```typescript
 * @CachePut({ key: 'user' })
 * async updateUser(id: string, data: UpdateUserDto) {
 *   return this.prisma.user.update({ where: { id }, data });
 * }
 * ```
 */
export const CachePut = (config: CacheConfig = {}) =>
  SetMetadata(CACHE_PUT_KEY, config);
