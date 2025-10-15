import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { SocialServiceModule } from './social-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SocialServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'social',
        protoPath: join(__dirname, '../../../proto/social.proto'),
        url: '0.0.0.0:50058',
      },
    },
  );

  await app.listen();
  console.log('🚀 Social Service is listening on port 50058');
}

bootstrap();

