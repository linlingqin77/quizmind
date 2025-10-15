import { Module } from '@nestjs/common';
import { SocialGrpcController } from './social-grpc.controller';
import { SocialService } from './social.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialGrpcController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialServiceModule {}

