import { Injectable } from '@nestjs/common';
import { router } from '../../core/trpc/trpc';
import { AuthRouter } from './auth/auth.router';
import { UsersRouter } from './users.router';
import { ExamsRouter } from './exams/exams.router';
import { QuestionsRouter } from './questions/questions.router';

/**
 * 应用主路由 - API Gateway
 * 职责：
 * 1. 聚合所有 tRPC 子路由
 * 2. 提供给前端统一的类型安全 API
 * 3. 后端路由会调用 gRPC 微服务
 */
@Injectable()
export class AppRouter {
  constructor(
    private readonly authRouter: AuthRouter,
    private readonly usersRouter: UsersRouter,
    private readonly examsRouter: ExamsRouter,
    private readonly questionsRouter: QuestionsRouter,
  ) {}

  /**
   * tRPC 主路由
   * 前端通过这个路由访问所有功能
   */
  appRouter = router({
    auth: this.authRouter.router,
    users: this.usersRouter.router,
    exams: this.examsRouter.router,
    questions: this.questionsRouter.router,
  });
}

/**
 * 导出路由类型供前端使用
 */
export type AppRouterType = AppRouter['appRouter'];

