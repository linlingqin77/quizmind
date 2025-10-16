import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TRPCService } from './trpc.service';
import { TRPCContext } from './context';
import { UsersModule } from '../../features/users/users.module';
import { AuthModule } from '../../features/auth/auth.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TRPCService, TRPCContext],
  exports: [TRPCContext],
})
export class TRPCModule {}

