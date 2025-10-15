import { Injectable } from '@nestjs/common';
import { ClientGrpcProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';

/**
 * gRPC 客户端工厂
 * 用于创建微服务客户端连接
 */
@Injectable()
export class GrpcClientFactory {
  /**
   * 创建用户服务客户端
   */
  createUserServiceClient(): ClientGrpcProxy {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, '../../../proto/user.proto'),
        url: process.env.USER_SERVICE_URL || 'localhost:50051',
      },
    }) as ClientGrpcProxy;
  }

  /**
   * 创建考试服务客户端
   */
  createExamServiceClient(): ClientGrpcProxy {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'exam',
        protoPath: join(__dirname, '../../../proto/exam.proto'),
        url: process.env.EXAM_SERVICE_URL || 'localhost:50052',
      },
    }) as ClientGrpcProxy;
  }

  /**
   * 创建题目服务客户端
   */
  createQuestionServiceClient(): ClientGrpcProxy {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'question',
        protoPath: join(__dirname, '../../../proto/question.proto'),
        url: process.env.QUESTION_SERVICE_URL || 'localhost:50053',
      },
    }) as ClientGrpcProxy;
  }

  /**
   * 创建通用 RabbitMQ 客户端
   */
  createRabbitMQClient(queueName: string = 'default') {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: queueName,
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  /**
   * 创建 Redis 客户端
   */
  createRedisClient() {
    return ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    });
  }

  /**
   * 创建 NATS 客户端
   */
  createNatsClient() {
    return ClientProxyFactory.create({
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL || 'nats://localhost:4222'],
      },
    });
  }

  /**
   * 创建 Kafka 客户端
   */
  createKafkaClient(clientId: string = 'ai-quiz-client') {
    return ClientProxyFactory.create({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId,
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        consumer: {
          groupId: `${clientId}-consumer`,
        },
      },
    });
  }
}
