import { SetMetadata } from '@nestjs/common';

/**
 * 审计装饰器
 * 用于标记需要审计的操作
 */

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;      // 操作名称
  resource: string;    // 资源类型
  description?: string; // 操作描述
}

/**
 * 审计日志装饰器
 * @param action 操作名称（CREATE_USER, UPDATE_QUESTION等）
 * @param resource 资源类型（User, Question等）
 * @param description 操作描述
 */
export const Audit = (action: string, resource: string, description?: string) =>
  SetMetadata(AUDIT_KEY, { action, resource, description });



