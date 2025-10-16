import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../../core/trpc/trpc';
import { UsersService } from './users.service';

@Injectable()
export class UsersRouter {
  constructor(private usersService: UsersService) {}

  router = router({
    // 通过ID获取用户信息
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return this.usersService.findById(input.id);
      }),
  });
}

