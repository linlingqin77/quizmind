import { Module } from '@nestjs/common';
import { UserGrpcController } from './user-grpc.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserGrpcController],
  providers: [UserService],
  exports: [UserService],
})
export class UserServiceModule {}

