import { Module } from '@nestjs/common';
import { AIGrpcController } from './ai-grpc.controller';
import { AIService } from './ai.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AIGrpcController],
  providers: [AIService],
  exports: [AIService],
})
export class AIServiceModule {}

