import { Module } from '@nestjs/common';
import { PracticeGrpcController } from './practice-grpc.controller';
import { PracticeService } from './practice.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PracticeGrpcController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeServiceModule {}

