import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

/**
 * 微服务客户端模块
 * 配置所有 gRPC 客户端连接
 */
@Module({
  imports: [
    // 用户服务客户端
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'user',
            protoPath: join(__dirname, '../../../proto/user.proto'),
            url: configService.get('USER_SERVICE_URL', 'localhost:50051'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
      },
      // 考试服务客户端
      {
        name: 'EXAM_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'exam',
            protoPath: join(__dirname, '../../../proto/exam.proto'),
            url: configService.get('EXAM_SERVICE_URL', 'localhost:50052'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
      },
      // 题目服务客户端
      {
        name: 'QUESTION_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'question',
            protoPath: join(__dirname, '../../../proto/question.proto'),
            url: configService.get('QUESTION_SERVICE_URL', 'localhost:50053'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}

