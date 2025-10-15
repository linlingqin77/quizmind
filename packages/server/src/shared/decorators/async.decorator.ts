import { SetMetadata } from '@nestjs/common';

export const ASYNC_KEY = 'async';

/**
 * @Async - 异步执行
 * 类似 Spring @Async
 * 
 * @example
 * ```typescript
 * @Async()
 * async sendEmail(to: string, subject: string, content: string) {
 *   await this.emailService.send(to, subject, content);
 *   // 这个方法会在后台异步执行，不会阻塞主流程
 * }
 * ```
 */
export const Async = () => SetMetadata(ASYNC_KEY, true);
