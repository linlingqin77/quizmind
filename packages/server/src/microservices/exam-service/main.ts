import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ExamServiceModule } from './exam-service.module';

/**
 * 考试微服务启动文件
 * 
 * 这是一个独立的 gRPC 微服务
 * 运行端口: 50052
 */
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ExamServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'exam',
        protoPath: join(__dirname, '../../../proto/exam.proto'),
        url: process.env.GRPC_URL || '0.0.0.0:50052',
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      },
    },
  );

  await app.listen();
  console.log('🚀 Exam Microservice is running on 0.0.0.0:50052');
}

bootstrap();

