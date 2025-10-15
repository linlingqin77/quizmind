import { SetMetadata } from '@nestjs/common';

// 定时任务配置
export interface ScheduledConfig {
  cron?: string;           // Cron 表达式
  fixedDelay?: number;     // 固定延迟（毫秒）
  fixedRate?: number;      // 固定速率（毫秒）
  initialDelay?: number;   // 初始延迟（毫秒）
}

export const SCHEDULED_KEY = 'scheduled';

/**
 * @Scheduled - 定时任务
 * 类似 Spring @Scheduled
 * 
 * @example
 * ```typescript
 * // Cron 表达式
 * @Scheduled({ cron: '0 0 2 * * *' })  // 每天凌晨2点
 * async cleanupOldData() {
 *   await this.dataService.cleanup();
 * }
 * 
 * // 固定延迟
 * @Scheduled({ fixedDelay: 5000 })  // 上次执行完5秒后再执行
 * async processQueue() {
 *   await this.queueService.process();
 * }
 * 
 * // 固定速率
 * @Scheduled({ fixedRate: 10000 })  // 每10秒执行一次
 * async syncData() {
 *   await this.syncService.sync();
 * }
 * ```
 */
export const Scheduled = (config: ScheduledConfig) =>
  SetMetadata(SCHEDULED_KEY, config);
