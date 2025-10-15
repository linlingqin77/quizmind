import { SetMetadata } from '@nestjs/common';

// 事务传播类型
export enum Propagation {
  REQUIRED = 'REQUIRED',           // 如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新事务
  REQUIRES_NEW = 'REQUIRES_NEW',   // 创建一个新事务，如果当前存在事务，则把当前事务挂起
  SUPPORTS = 'SUPPORTS',           // 如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务方式执行
  NOT_SUPPORTED = 'NOT_SUPPORTED', // 以非事务方式执行操作，如果当前存在事务，就把当前事务挂起
  NEVER = 'NEVER',                 // 以非事务方式执行，如果当前存在事务，则抛出异常
  MANDATORY = 'MANDATORY',         // 如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常
}

// 事务隔离级别
export enum Isolation {
  DEFAULT = 'DEFAULT',
  READ_UNCOMMITTED = 'READ_UNCOMMITTED',
  READ_COMMITTED = 'READ_COMMITTED',
  REPEATABLE_READ = 'REPEATABLE_READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

// 事务配置
export interface TransactionalConfig {
  propagation?: Propagation;
  isolation?: Isolation;
  timeout?: number;
  readOnly?: boolean;
}

export const TRANSACTIONAL_KEY = 'transactional';

/**
 * @Transactional - 声明式事务
 * 类似 Spring @Transactional
 * 
 * @example
 * ```typescript
 * @Transactional({
 *   propagation: Propagation.REQUIRED,
 *   isolation: Isolation.READ_COMMITTED
 * })
 * async transferMoney(fromId: string, toId: string, amount: number) {
 *   await this.prisma.account.update({
 *     where: { id: fromId },
 *     data: { balance: { decrement: amount } }
 *   });
 *   
 *   await this.prisma.account.update({
 *     where: { id: toId },
 *     data: { balance: { increment: amount } }
 *   });
 * }
 * ```
 */
export const Transactional = (config: TransactionalConfig = {}) =>
  SetMetadata(TRANSACTIONAL_KEY, {
    propagation: Propagation.REQUIRED,
    isolation: Isolation.READ_COMMITTED,
    timeout: 30000,
    readOnly: false,
    ...config,
  });
