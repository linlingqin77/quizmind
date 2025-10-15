# 微服务目录

这个目录包含所有独立的 gRPC 微服务。

## 📁 目录结构

```
microservices/
├── user-service/           # 用户服务 ✅
│   ├── user-grpc.controller.ts
│   ├── user.service.ts
│   ├── user-service.module.ts
│   └── main.ts
├── exam-service/           # 考试服务 ✅
│   ├── exam-grpc.controller.ts
│   ├── exam.service.ts
│   ├── exam-service.module.ts
│   └── main.ts
├── question-service/       # 题目服务 ✅
│   ├── question-grpc.controller.ts
│   ├── question.service.ts
│   ├── question-service.module.ts
│   └── main.ts
├── paper-service/          # 试卷服务 ✅
│   ├── paper-grpc.controller.ts
│   ├── paper.service.ts
│   ├── paper-service.module.ts
│   └── main.ts
├── ai-service/             # AI服务 ✅
│   ├── ai-grpc.controller.ts
│   ├── ai.service.ts
│   ├── ai-service.module.ts
│   └── main.ts
├── practice-service/       # 练习服务 ✅
│   ├── practice-grpc.controller.ts
│   ├── practice.service.ts
│   ├── practice-service.module.ts
│   └── main.ts
├── analytics-service/      # 分析服务 ✅
│   ├── analytics-grpc.controller.ts
│   ├── analytics.service.ts
│   ├── analytics-service.module.ts
│   └── main.ts
├── social-service/         # 社交服务 ✅
│   ├── social-grpc.controller.ts
│   ├── social.service.ts
│   ├── social-service.module.ts
│   └── main.ts
└── document-service/       # 文档服务 ✅
    ├── document-grpc.controller.ts
    ├── document.service.ts
    ├── document-service.module.ts
    └── main.ts
```

## 🚀 运行微服务

### 1. 用户服务 (User Service)

```bash
npm run start:user-service
# 或
ts-node src/microservices/user-service/main.ts
```

监听端口: `50051`

### 2. 考试服务 (Exam Service)

```bash
npm run start:exam-service
# 或
ts-node src/microservices/exam-service/main.ts
```

监听端口: `50052`

### 3. 题目服务 (Question Service)

```bash
npm run start:question-service
# 或
ts-node src/microservices/question-service/main.ts
```

监听端口: `50053`

### 4. 试卷服务 (Paper Service)

```bash
npm run start:paper-service
# 或
ts-node src/microservices/paper-service/main.ts
```

监听端口: `50054`

### 5. AI服务 (AI Service)

```bash
npm run start:ai-service
# 或
ts-node src/microservices/ai-service/main.ts
```

监听端口: `50055`

### 6. 练习服务 (Practice Service)

```bash
npm run start:practice-service
# 或
ts-node src/microservices/practice-service/main.ts
```

监听端口: `50056`

### 7. 分析服务 (Analytics Service)

```bash
npm run start:analytics-service
# 或
ts-node src/microservices/analytics-service/main.ts
```

监听端口: `50057`

### 8. 社交服务 (Social Service)

```bash
npm run start:social-service
# 或
ts-node src/microservices/social-service/main.ts
```

监听端口: `50058`

### 9. 文档服务 (Document Service)

```bash
npm run start:document-service
# 或
ts-node src/microservices/document-service/main.ts
```

监听端口: `50059`

## 🏗️ 架构说明

### 通信流程

```
前端 (React)
    ↓ tRPC
API Gateway (NestJS)
    ↓ gRPC
微服务 (NestJS)
    ↓
数据库 (PostgreSQL)
```

### 为什么这样设计？

1. **前端 ↔ API Gateway**
   - ✅ 使用 tRPC（类型安全，开发体验好）
   - ✅ 前端获得完整的 TypeScript 类型

2. **API Gateway ↔ 微服务**
   - ✅ 使用 gRPC（高性能，跨语言支持）
   - ✅ Protocol Buffer 二进制序列化

3. **前端类型来源**
   - ✅ 来自 tRPC（不是 gRPC）
   - ✅ API Gateway 负责转换

## 📝 开发新的微服务

### 步骤：

1. **创建 Proto 文件**
   ```bash
   touch proto/my-service.proto
   ```

2. **创建微服务目录**
   ```bash
   mkdir -p src/microservices/my-service
   ```

3. **实现 gRPC 控制器**
   ```typescript
   @Controller()
   export class MyGrpcController {
     @GrpcMethod('MyService', 'FindById')
     async findById(data: { id: string }) {
       // 实现逻辑
     }
   }
   ```

4. **创建启动文件**
   ```typescript
   // main.ts
   const app = await NestFactory.createMicroservice(
     MyServiceModule,
     { transport: Transport.GRPC, ... }
   );
   ```

5. **在 API Gateway 添加客户端**
   ```typescript
   // microservices.module.ts
   ClientsModule.registerAsync([{
     name: 'MY_SERVICE',
     ...
   }])
   ```

6. **创建 tRPC 路由**
   ```typescript
   // my.router.ts
   @Injectable()
   export class MyRouter implements OnModuleInit {
     @Inject('MY_SERVICE') private grpcClient: ClientGrpc;
     // 实现路由
   }
   ```

## 🐳 Docker 部署

### docker-compose.yml

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - USER_SERVICE_URL=user-service:50051
      - EXAM_SERVICE_URL=exam-service:50052
      - QUESTION_SERVICE_URL=question-service:50053

  # 用户微服务
  user-service:
    build:
      context: .
      dockerfile: Dockerfile.user-service
    ports:
      - "50051:50051"

  # 考试微服务
  exam-service:
    build:
      context: .
      dockerfile: Dockerfile.exam-service
    ports:
      - "50052:50052"

  # 题目微服务
  question-service:
    build:
      context: .
      dockerfile: Dockerfile.question-service
    ports:
      - "50053:50053"
```

## 📊 微服务端口分配

| 服务 | 端口 | 协议 | 状态 |
|-----|------|------|------|
| API Gateway | 3000 | HTTP/tRPC | ✅ |
| User Service | 50051 | gRPC | ✅ |
| Exam Service | 50052 | gRPC | ✅ |
| Question Service | 50053 | gRPC | ✅ |
| Paper Service | 50054 | gRPC | ✅ |
| AI Service | 50055 | gRPC | ✅ |
| Practice Service | 50056 | gRPC | ✅ |
| Analytics Service | 50057 | gRPC | ✅ |
| Social Service | 50058 | gRPC | ✅ |
| Document Service | 50059 | gRPC | ✅ |

## 🔍 监控和调试

### 使用 grpcurl 调试

```bash
# 列出服务
grpcurl -plaintext localhost:50052 list

# 调用方法
grpcurl -plaintext \
  -d '{"id": "exam_123"}' \
  localhost:50052 \
  exam.ExamService/FindById
```

### 使用 BloomRPC

推荐使用 [BloomRPC](https://github.com/bloomrpc/bloomrpc) 进行可视化调试。

## 📚 相关文档

- [gRPC 官方文档](https://grpc.io/docs/)
- [NestJS 微服务](https://docs.nestjs.com/microservices/basics)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)

