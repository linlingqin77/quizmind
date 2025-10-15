import { Module } from '@nestjs/common';
import { ExamGrpcController } from './exam-grpc.controller';

/**
 * 考试微服务模块
 * 
 * 这是一个独立的微服务模块
 * 只包含 gRPC 控制器和相关业务逻辑
 */
@Module({
  controllers: [ExamGrpcController],
  providers: [
    // TODO: 添加 ExamsService 等业务逻辑
    // ExamsService,
    // PrismaService,
  ],
})
export class ExamServiceModule {}

