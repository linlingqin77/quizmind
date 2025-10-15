import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PaperServiceModule } from './paper-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaperServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'paper',
        protoPath: join(__dirname, '../../../proto/paper.proto'),
        url: '0.0.0.0:50054',
      },
    },
  );

  await app.listen();
  console.log('🚀 Paper Service is listening on port 50054');
}

bootstrap();

