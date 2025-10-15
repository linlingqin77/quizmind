import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../../core/trpc/trpc';
import { UsersService } from '../../features/auth/services/users.service';

/**
 * 用户路由
 * 定义所有用户管理相关的 tRPC 端点
 */

@Injectable()
export class UsersRouter {
  constructor(private readonly usersService: UsersService) {}

  router = router({
    // 通过 ID 获取用户
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return this.usersService.findById(input.id);
      }),

    // 获取所有用户（仅管理员）
    getAll: adminProcedure
      .query(async () => {
        return this.usersService.findAll();
      }),
  });
}

