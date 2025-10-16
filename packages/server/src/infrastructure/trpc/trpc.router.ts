import { Injectable } from '@nestjs/common';
import { router } from './trpc.service';
import { AuthRouter } from '../../features/auth/auth.router';
import { UsersRouter } from '../../features/users/users.router';

@Injectable()
export class AppRouter {
  constructor(
    private authRouter: AuthRouter,
    private usersRouter: UsersRouter,
  ) {}

  // 应用的主路由
  appRouter = router({
    auth: this.authRouter.router as any,
    users: this.usersRouter.router as any,
  });
}

export type AppRouterType = AppRouter['appRouter'];

