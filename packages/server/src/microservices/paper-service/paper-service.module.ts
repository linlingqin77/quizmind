import { Module } from '@nestjs/common';
import { PaperGrpcController } from './paper-grpc.controller';
import { PaperService } from './paper.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaperGrpcController],
  providers: [PaperService],
  exports: [PaperService],
})
export class PaperServiceModule {}

