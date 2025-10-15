import { Module } from '@nestjs/common';
import { DocumentGrpcController } from './document-grpc.controller';
import { DocumentService } from './document.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentGrpcController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentServiceModule {}

