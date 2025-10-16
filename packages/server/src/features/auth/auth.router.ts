import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../../core/trpc/trpc';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// 输入验证Schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(4, '用户名至少4个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, '请输入用户名或邮箱'),
  password: z.string().min(1, '请输入密码'),
});

const updateProfileSchema = z.object({
  nickname: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z.string().min(6, '新密码至少6个字符'),
});

@Injectable()
export class AuthRouter {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
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
        return this.usersService.updateUser(ctx.user.id, input);
      }),

    // 修改密码
    changePassword: protectedProcedure
      .input(changePasswordSchema)
      .mutation(async ({ ctx, input }) => {
        return this.usersService.changePassword(
          ctx.user.id,
          input.oldPassword,
          input.newPassword,
        );
      }),
  });
}

