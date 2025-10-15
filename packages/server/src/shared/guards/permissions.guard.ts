import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../../enterprise/permissions/permissions.service';

/**
 * 权限守卫
 * 检查用户是否有访问特定资源的权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      string[] | { any?: string[]; all?: string[] }
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true; // 没有权限要求，允许访问
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 获取用户所有权限
    const userPermissions = await this.permissionsService.getUserPermissions(user.id);

    // 处理简单数组形式的权限要求
    if (Array.isArray(requiredPermissions)) {
      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException('权限不足');
      }

      return true;
    }

    // 处理 any 或 all 形式的权限要求
    if (requiredPermissions.any) {
      const hasAnyPermission = requiredPermissions.any.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException('权限不足');
      }

      return true;
    }

    if (requiredPermissions.all) {
      const hasAllPermissions = requiredPermissions.all.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException('权限不足');
      }

      return true;
    }

    return true;
  }
}



