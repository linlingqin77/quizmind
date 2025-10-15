import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { QuestionServiceModule } from './question-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    QuestionServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'question',
        protoPath: join(__dirname, '../../../proto/question.proto'),
        url: '0.0.0.0:50053',
      },
    },
  );

  await app.listen();
  console.log('🚀 Question Service is listening on port 50053');
}

bootstrap();

