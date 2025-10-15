import { Module } from '@nestjs/common';
import { AuthModule } from '../features/auth/auth.module';
import { MicroservicesModule } from '../infrastructure/microservices/microservices.module';
import { AuthRouter } from './routers/auth/auth.router';
import { UsersRouter } from './routers/users.router';
import { ExamsRouter } from './routers/exams/exams.router';
import { QuestionsRouter } from './routers/questions/questions.router';
import { AppRouter } from './routers/app.router';

/**
 * 表现层模块 - API Gateway
 * 职责：
 * 1. 提供 tRPC 路由给前端
 * 2. 调用 gRPC 微服务
 * 3. 转换和聚合响应
 */
@Module({
  imports: [
    AuthModule,
    MicroservicesModule,  // 导入微服务客户端
  ],
  providers: [
    AuthRouter,
    UsersRouter,
    ExamsRouter,
    QuestionsRouter,
    AppRouter,
  ],
  exports: [AppRouter],
})
export class PresentationModule {}

