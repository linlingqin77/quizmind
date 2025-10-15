import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AnalyticsServiceModule } from './analytics-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AnalyticsServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'analytics',
        protoPath: join(__dirname, '../../../proto/analytics.proto'),
        url: '0.0.0.0:50057',
      },
    },
  );

  await app.listen();
  console.log('🚀 Analytics Service is listening on port 50057');
}

bootstrap();

