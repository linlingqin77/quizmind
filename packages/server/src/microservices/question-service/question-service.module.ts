import { Module } from '@nestjs/common';
import { QuestionGrpcController } from './question-grpc.controller';
import { QuestionService } from './question.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionGrpcController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionServiceModule {}

