import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PracticeServiceModule } from './practice-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PracticeServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'practice',
        protoPath: join(__dirname, '../../../proto/practice.proto'),
        url: '0.0.0.0:50056',
      },
    },
  );

  await app.listen();
  console.log('🚀 Practice Service is listening on port 50056');
}

bootstrap();

