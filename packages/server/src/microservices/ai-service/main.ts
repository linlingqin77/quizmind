import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AIServiceModule } from './ai-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AIServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'ai',
        protoPath: join(__dirname, '../../../proto/ai.proto'),
        url: '0.0.0.0:50055',
      },
    },
  );

  await app.listen();
  console.log('🚀 AI Service is listening on port 50055');
}

bootstrap();

