import { Injectable } from '@nestjs/common';
import { router } from './trpc.service';
import { AuthRouter } from '../auth/auth.router';
import { UsersRouter } from '../users/users.router';

@Injectable()
export class AppRouter {
  constructor(
    private authRouter: AuthRouter,
    private usersRouter: UsersRouter,
  ) {}

  // 应用的主路由
  appRouter = router({
    auth: this.authRouter.router,
    users: this.usersRouter.router,
  });
}

export type AppRouterType = AppRouter['appRouter'];

