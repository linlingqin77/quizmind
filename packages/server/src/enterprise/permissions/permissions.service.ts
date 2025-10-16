import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

/**
 * 权限服务
 * 处理 RBAC 权限检查和管理
 */
@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户是否有特定权限
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const user: any = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rbacRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        customPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) return false;

    // 1. 检查自定义权限（优先级最高）
    const customPermission = user.customPermissions?.find(
      (cp) => cp.permission.resource === resource && cp.permission.action === action,
    );

    if (customPermission) {
      return customPermission.granted;
    }

    // 2. 检查角色权限
    const rolePermissions = user.rbacRole?.permissions || [];
    return rolePermissions.some(
      (rp: any) => rp.permission.resource === resource && rp.permission.action === action,
    );
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user: any = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rbacRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        customPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) return [];

    const permissions = new Set<string>();

    // 添加角色权限
    user.role?.permissions.forEach((rp) => {
      permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
    });

    // 处理自定义权限
    user.customPermissions?.forEach((cp) => {
      const permKey = `${cp.permission.resource}:${cp.permission.action}`;
      if (cp.granted) {
        permissions.add(permKey);
      } else {
        permissions.delete(permKey);
      }
    });

    return Array.from(permissions);
  }

  /**
   * 授予用户权限
   */
  async grantPermission(userId: string, resource: string, action: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        resource_action: { resource, action },
      },
    });

    if (!permission) {
      throw new Error('权限不存在');
    }

    await this.prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      create: {
        userId,
        permissionId: permission.id,
        granted: true,
      },
      update: {
        granted: true,
      },
    });
  }

  /**
   * 撤销用户权限
   */
  async revokePermission(userId: string, resource: string, action: string): Promise<void> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        resource_action: { resource, action },
      },
    });

    if (!permission) {
      throw new Error('权限不存在');
    }

    await this.prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      create: {
        userId,
        permissionId: permission.id,
        granted: false,
      },
      update: {
        granted: false,
      },
    });
  }

  /**
   * 为角色分配权限
   */
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * 从角色移除权限
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  /**
   * 创建权限
   */
  async createPermission(
    resource: string,
    action: string,
    description?: string,
  ) {
    return this.prisma.permission.create({
      data: {
        resource,
        action,
        description,
      },
    });
  }

  /**
   * 创建角色
   */
  async createRole(
    name: string,
    displayName: string,
    description?: string,
    isSystem = false,
  ) {
    return this.prisma.role.create({
      data: {
        name,
        displayName,
        description,
        isSystem,
      },
    });
  }

  /**
   * 获取所有角色
   */
  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * 获取所有权限
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany();
  }
}



