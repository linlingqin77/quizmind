import { Module } from '@nestjs/common';
import { AnalyticsGrpcController } from './analytics-grpc.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsGrpcController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsServiceModule {}

