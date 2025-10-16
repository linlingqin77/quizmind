import { Injectable } from '@nestjs/common';
import { router, publicProcedure, protectedProcedure } from '../../../core/trpc/trpc';
import { AuthService } from '../../../features/auth/services/auth.service';
import { UsersService } from '../../../features/auth/services/users.service';

// ✅ 导入所有 Schema
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './schemas';

/**
 * 认证路由
 * 定义所有认证相关的 tRPC 端点
 */

@Injectable()
export class AuthRouter {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  router = router({
    // 注册
    register: publicProcedure
      .input(registerSchema)
      .mutation(async ({ input }) => {
        return this.authService.register(input as any);
      }),

    // 登录
    login: publicProcedure
      .input(loginSchema)
      .mutation(async ({ input }) => {
        return this.authService.login(input.identifier, input.password);
      }),

    // 获取当前用户信息
    me: protectedProcedure
      .query(async ({ ctx }) => {
        return ctx.user;
      }),

    // 刷新Token
    refreshToken: protectedProcedure
      .mutation(async ({ ctx }) => {
        return this.authService.refreshToken(ctx.user.id);
      }),

    // 更新个人信息
    updateProfile: protectedProcedure
      .input(updateProfileSchema)
      .mutation(async ({ ctx, input }) => {
        return this.usersService.updateProfile(ctx.user.id, input);
      }),

    // 修改密码
    changePassword: protectedProcedure
      .input(changePasswordSchema)
      .mutation(async ({ ctx, input }) => {
        await this.authService.changePassword(
          ctx.user.id,
          input.oldPassword,
          input.newPassword,
        );
        return { success: true, message: '密码修改成功' };
      }),
  });
}

