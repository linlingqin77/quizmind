import { SetMetadata } from '@nestjs/common';

/**
 * 权限装饰器
 * 用于标记需要特定权限的路由
 */

export const PERMISSIONS_KEY = 'permissions';

/**
 * 要求特定权限
 * @param permissions 权限列表，格式: 'resource:action'
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 要求任一权限
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { any: permissions });

/**
 * 要求所有权限
 */
export const RequireAllPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { all: permissions });



