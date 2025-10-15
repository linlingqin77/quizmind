import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DocumentServiceModule } from './document-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    DocumentServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'document',
        protoPath: join(__dirname, '../../../proto/document.proto'),
        url: '0.0.0.0:50059',
      },
    },
  );

  await app.listen();
  console.log('🚀 Document Service is listening on port 50059');
}

bootstrap();

