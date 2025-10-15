import { Global, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';

/**
 * 权限模块
 * 全局模块，提供 RBAC 权限管理功能
 */
@Global()
@Module({
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}



