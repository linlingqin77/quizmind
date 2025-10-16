import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRouter } from './users.router';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersRouter],
  exports: [UsersService],
})
export class UsersModule {}

