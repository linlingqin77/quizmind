# AI Quiz System - 完整开发指南

> 🚀 基于 NestJS 的企业级智能题库系统  
> 📚 从零开始的完整教程，适合初学者和企业开发

---

## 📖 目录

### 第一部分：快速上手
- [项目概述](#项目概述)
- [快速开始](#快速开始)
- [项目架构](#项目架构)
- [目录结构](#目录结构)

### 第二部分：核心功能
- [认证与授权](#认证与授权)
- [权限系统 (RBAC)](#权限系统-rbac)
- [审计日志](#审计日志)
- [文件上传](#文件上传)
- [邮件服务](#邮件服务)
- [消息队列](#消息队列)

### 第三部分：开发规范
- [代码规范](#代码规范)
- [模块开发](#模块开发)
- [数据验证](#数据验证)
- [数据完整性](#数据完整性)
- [错误处理](#错误处理)

### 第四部分：高级特性
- [Spring Boot 风格装饰器](#spring-boot-风格装饰器)
- [微服务架构](#微服务架构)
- [性能优化](#性能优化)
- [监控与日志](#监控与日志)

### 第五部分：部署运维
- [Docker 部署](#docker-部署)
- [环境配置](#环境配置)
- [健康检查](#健康检查)
- [故障排查](#故障排查)

---

## 第一部分：快速上手

### 项目概述

**AI Quiz System** 是一个企业级的智能题库学习系统，采用现代化的技术栈和架构设计。

#### 技术栈

**后端**:
- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + Passport
- **API**: tRPC (类型安全) + REST (特殊场景)
- **缓存**: Redis
- **消息队列**: BullMQ
- **监控**: Prometheus + Sentry

**前端**:
- **Web**: React + TypeScript
- **Mobile**: React Native
- **状态管理**: Redux Toolkit
- **API 客户端**: tRPC Client

**企业功能**:
- ✅ RBAC 权限系统
- ✅ 审计日志
- ✅ 文件上传
- ✅ 邮件服务
- ✅ 消息队列
- ✅ 健康检查
- ✅ 监控指标
- ✅ WebSocket 实时通信

---

### 快速开始

#### 环境要求

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x (可选)
- Docker (推荐)

#### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd packages/server

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

# 5. 启动开发服务器
npm run start:dev
```

#### 访问应用

- **API 服务**: http://localhost:3000
- **Swagger 文档**: http://localhost:3000/api/docs
- **健康检查**: http://localhost:3000/health
- **监控指标**: http://localhost:3000/metrics

---

### 项目架构

#### 整体架构

```
┌─────────────┐
│   前端应用   │  (React / React Native)
└──────┬──────┘
       │ tRPC / REST
       ▼
┌─────────────────────────────────────┐
│         NestJS 后端服务              │
│  ┌───────────────────────────────┐  │
│  │     Presentation Layer        │  │  ← tRPC Routers
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │      Business Features        │  │  ← 业务功能
│  │  (Auth, Users, Exams, etc.)   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Enterprise Features         │  │  ← 企业功能
│  │  (RBAC, Audit, Email, etc.)   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │     Infrastructure            │  │  ← 基础设施
│  │  (Prisma, Health, Metrics)    │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        └──────────────┘
```

#### 分层设计

| 层级 | 职责 | 示例模块 |
|-----|------|---------|
| **Core** | 核心框架 | config, database, logging, trpc |
| **Infrastructure** | 基础设施 | prisma, health, metrics, websocket |
| **Features** | 业务功能 | auth, users, exams, questions |
| **Enterprise** | 企业功能 | audit, permissions, email, queue |
| **Shared** | 共享组件 | decorators, guards, interceptors |
| **Presentation** | 表现层 | tRPC routers |

---

### 目录结构

```
packages/server/
├── src/
│   ├── core/                      # 核心框架
│   │   ├── config/               # 配置管理
│   │   ├── database/             # 数据库连接
│   │   ├── logging/              # 日志系统
│   │   ├── monitoring/           # 监控集成
│   │   ├── security/             # 安全配置
│   │   └── trpc/                 # tRPC 核心
│   │
│   ├── infrastructure/           # 基础设施模块
│   │   ├── prisma/              # 数据库服务
│   │   ├── health/              # 健康检查
│   │   ├── metrics/             # 监控指标
│   │   ├── trpc/                # tRPC 基础
│   │   └── websocket/           # WebSocket
│   │
│   ├── features/                 # 业务功能模块
│   │   ├── auth/                # 认证授权
│   │   │   ├── services/
│   │   │   ├── strategies/
│   │   │   ├── repositories/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/               # 用户管理
│   │   ├── exams/               # 考试管理（待实现）
│   │   ├── questions/           # 题目管理（待实现）
│   │   └── practice/            # 练习系统（待实现）
│   │
│   ├── enterprise/              # 企业级功能
│   │   ├── audit/              # 审计日志
│   │   ├── permissions/        # 权限管理
│   │   ├── email/              # 邮件服务
│   │   ├── upload/             # 文件上传
│   │   └── queue/              # 消息队列
│   │
│   ├── shared/                  # 共享组件
│   │   ├── decorators/         # 自定义装饰器
│   │   ├── guards/             # 守卫
│   │   ├── interceptors/       # 拦截器
│   │   ├── filters/            # 异常过滤器
│   │   └── services/           # 共享服务
│   │
│   ├── presentation/           # 表现层
│   │   └── routers/            # tRPC 路由
│   │       ├── app.router.ts   # 主路由聚合
│   │       ├── auth.router.ts
│   │       └── users.router.ts
│   │
│   ├── app.module.ts           # 根模块
│   └── main.ts                 # 应用入口
│
├── prisma/                      # Prisma 配置
│   ├── schema.prisma           # 数据库模型
│   └── seed.ts                 # 种子数据
│
├── proto/                       # gRPC Proto 文件
├── test/                        # 测试文件
└── package.json

```

---

## 第二部分：核心功能

### 认证与授权

#### JWT 认证流程

```typescript
// 1. 用户注册
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123"
}

// 2. 用户登录
POST /api/auth/login
{
  "identifier": "user@example.com",
  "password": "password123"
}

// 返回
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}

// 3. 使用 Token 访问保护资源
GET /api/users/me
Authorization: Bearer eyJhbGc...
```

#### 使用 tRPC 的认证

```typescript
// auth.router.ts
import { router, publicProcedure, protectedProcedure } from '../../core/trpc/trpc';

export class AuthRouter {
  router = router({
    // 公开接口
    register: publicProcedure
      .input(registerSchema)
      .mutation(async ({ input }) => {
        return this.authService.register(input);
      }),

    // 受保护接口
    me: protectedProcedure
      .query(async ({ ctx }) => {
        return ctx.user; // 已通过认证的用户
      }),
  });
}
```

#### 前端使用

```typescript
// 注册
const result = await trpc.auth.register.mutate({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'password123',
});

// 登录
const { accessToken } = await trpc.auth.login.mutate({
  identifier: 'user@example.com',
  password: 'password123',
});

// 获取当前用户
const user = await trpc.auth.me.query();
```

---

### 权限系统 (RBAC)

#### 权限装饰器

```typescript
import { RequirePermissions } from '@/shared/decorators/permissions.decorator';

@Controller('exams')
export class ExamsController {
  // 需要 exam:read 权限
  @Get()
  @RequirePermissions('exam:read')
  async findAll() {
    return this.examsService.findAll();
  }

  // 需要 exam:create 权限
  @Post()
  @RequirePermissions('exam:create')
  async create(@Body() dto: CreateExamDto) {
    return this.examsService.create(dto);
  }

  // 需要任一权限
  @Get('stats')
  @RequireAnyPermission(['exam:read', 'exam:admin'])
  async getStats() {
    return this.examsService.getStats();
  }

  // 需要所有权限
  @Delete(':id')
  @RequireAllPermissions(['exam:delete', 'exam:admin'])
  async delete(@Param('id') id: string) {
    return this.examsService.delete(id);
  }
}
```

#### 权限格式

- 格式: `resource:action`
- 示例:
  - `user:create` - 创建用户
  - `user:read` - 查看用户
  - `user:update` - 更新用户
  - `user:delete` - 删除用户
  - `exam:*` - 考试的所有权限
  - `*:*` - 超级管理员

---

### 审计日志

#### 使用审计装饰器

```typescript
import { Audit } from '@/shared/interceptors/audit.interceptor';

@Controller('users')
export class UsersController {
  @Post()
  @Audit({ 
    action: 'CREATE', 
    resource: 'USER' 
  })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Audit({ 
    action: 'UPDATE', 
    resource: 'USER',
    skipResponse: true // 不记录响应数据
  })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
```

#### 审计日志查询

```typescript
// 查询用户操作记录
const logs = await this.auditService.findByUser(userId);

// 查询特定资源的操作记录
const logs = await this.auditService.findByResource('USER', resourceId);

// 查询特定时间范围的操作
const logs = await this.auditService.findByDateRange(startDate, endDate);
```

---

### 文件上传

#### REST Controller（文件上传必须用 REST）

```typescript
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  // 单文件上传
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadAvatar(file);
  }

  // 多文件上传
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadImages(files);
  }
}
```

#### 文件访问控制

```typescript
// 需要权限才能访问文件
@Get(':id')
@RequirePermissions('file:read')
async download(@Param('id') id: string, @Res() res: Response) {
  const file = await this.uploadService.getFile(id);
  res.sendFile(file.path);
}
```

---

### 邮件服务

#### 发送邮件

```typescript
// 发送验证邮件
await this.emailService.sendVerificationEmail(user.email, {
  username: user.username,
  verificationLink: `${baseUrl}/verify?token=${token}`,
});

// 发送密码重置邮件
await this.emailService.sendPasswordResetEmail(user.email, {
  username: user.username,
  resetLink: `${baseUrl}/reset-password?token=${token}`,
});

// 发送自定义邮件
await this.emailService.sendEmail({
  to: 'user@example.com',
  subject: '欢迎加入',
  template: 'welcome',
  context: {
    username: 'John',
    loginUrl: 'https://app.example.com',
  },
});
```

#### 邮件模板

```handlebars
<!-- templates/verification.hbs -->
<h1>欢迎，{{username}}！</h1>
<p>请点击下面的链接验证您的邮箱：</p>
<a href="{{verificationLink}}">验证邮箱</a>
```

---

### 消息队列

#### 添加任务到队列

```typescript
// 发送邮件任务
await this.queueService.addEmailJob({
  to: 'user@example.com',
  subject: '欢迎',
  template: 'welcome',
  context: { username: 'John' },
});

// 批量导入任务
await this.queueService.addImportJob({
  fileUrl: 'https://example.com/data.csv',
  userId: 'user123',
});
```

#### 处理任务

```typescript
@Processor('email')
export class EmailProcessor {
  @Process('send')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { to, subject, template, context } = job.data;
    await this.emailService.send(to, subject, template, context);
  }
}
```

---

## 第三部分：开发规范

### 代码规范

#### TypeScript 规范

```typescript
// ✅ 好的示例
interface User {
  id: string;
  email: string;
  username: string;
}

async function findUser(id: string): Promise<User | null> {
  return this.prisma.user.findUnique({ where: { id } });
}

// ❌ 避免使用 any
function processData(data: any) { // ❌
  return data.value;
}

// ✅ 使用明确的类型
function processData(data: UserData): string {
  return data.value;
}
```

#### 命名规范

- **文件**: `kebab-case`
  - ✅ `user.service.ts`
  - ✅ `exam-records.controller.ts`
  - ❌ `UserService.ts`

- **类**: `PascalCase`
  - ✅ `UsersService`
  - ✅ `AuthController`

- **方法/变量**: `camelCase`
  - ✅ `findUser()`
  - ✅ `currentUser`

- **常量**: `UPPER_SNAKE_CASE`
  - ✅ `MAX_RETRY_COUNT`
  - ✅ `DEFAULT_PAGE_SIZE`

---

### 模块开发

#### 模块分类规则

**1. Infrastructure（基础设施）**
- 放置通用的、与业务无关的技术模块
- 示例: 数据库连接、缓存、监控、WebSocket

**2. Features（业务功能）**
- 放置核心业务逻辑模块
- 示例: 用户管理、题库、考试、练习
- **使用 tRPC Router**

**3. Enterprise（企业功能）**
- 放置企业级增强功能
- 示例: 权限、审计、邮件、队列

#### tRPC 模块结构（推荐）

```
features/exams/
├── schemas/                    # Zod 验证
│   ├── create-exam.schema.ts
│   ├── update-exam.schema.ts
│   └── query-exams.schema.ts
├── exams.router.ts            # tRPC 路由
├── exams.service.ts           # 业务逻辑
└── exams.module.ts            # NestJS 模块
```

```typescript
// exams.router.ts
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { router, protectedProcedure } from '../../core/trpc/trpc';
import { ExamsService } from './exams.service';

// Zod 验证 Schema
const createExamSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().positive(),
});

@Injectable()
export class ExamsRouter {
  constructor(private examsService: ExamsService) {}

  router = router({
    // 列表查询
    list: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      }))
      .query(async ({ input }) => {
        return this.examsService.findAll(input);
      }),

    // 创建
    create: protectedProcedure
      .input(createExamSchema)
      .mutation(async ({ input, ctx }) => {
        return this.examsService.create(input, ctx.user.id);
      }),
  });
}
```

#### REST 模块结构（特殊场景）

```
enterprise/upload/
├── dto/                       # class-validator DTO
│   └── upload-file.dto.ts
├── upload.controller.ts       # REST Controller
├── upload.service.ts          # 业务逻辑
└── upload.module.ts           # NestJS 模块
```

---

### 数据验证

#### 验证策略总览

本项目使用**双重验证策略**：

| 场景 | 验证工具 | 说明 |
|-----|---------|------|
| **tRPC 接口** | Zod | 类型安全的 Schema 验证 |
| **REST 接口** | class-validator | 装饰器风格的 DTO 验证 |

#### tRPC + Zod 验证（推荐用于业务功能）

```typescript
// ✅ tRPC 使用 Zod Schema
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(4, '用户名至少4个字符').max(20),
  password: z.string().min(6, '密码至少6个字符'),
  age: z.number().int().min(18, '必须年满18岁').optional(),
});

export class UsersRouter {
  router = router({
    create: protectedProcedure
      .input(createUserSchema) // ← Zod 验证
      .mutation(async ({ input }) => {
        // input 已经被验证和类型推导
        return this.usersService.create(input);
      }),
  });
}
```

#### REST + class-validator 验证（特殊场景）

```typescript
// ✅ REST 使用 class-validator DTO
import { IsString, IsEmail, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(4, { message: '用户名至少4个字符' })
  username: string;

  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @IsOptional()
  @IsInt()
  @Min(18, { message: '必须年满18岁' })
  age?: number;
}

@Controller('users')
export class UsersController {
  @Post()
  async create(@Body() dto: CreateUserDto) { // ← 自动验证
    return this.usersService.create(dto);
  }
}
```

#### 为什么使用两种验证？

| 特性 | tRPC + Zod | REST + class-validator |
|-----|-----------|----------------------|
| **类型安全** | ✅ 完美（编译时+运行时） | ⚠️ 部分（仅运行时） |
| **前端集成** | ✅ 自动类型推导 | ❌ 需要手动定义类型 |
| **验证性能** | ✅ 高效 | ✅ 高效 |
| **适用场景** | 业务 API | 文件上传、Webhook |

---

### 数据完整性

#### 阿里开发规范：不使用物理外键

**原因**：
- ❌ 物理外键会降低性能
- ❌ 分布式场景下难以维护
- ❌ 数据迁移复杂
- ✅ 应用层更灵活可控

#### 数据库设计（无物理外键）

```sql
-- ✅ 正确的设计（逻辑外键）
CREATE TABLE exam_records (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) NOT NULL COMMENT '逻辑外键，指向 users.id',
  exam_id VARCHAR(25) NOT NULL COMMENT '逻辑外键，指向 exams.id',
  score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 为逻辑外键建立索引
  INDEX idx_exam_records_user_id (user_id),
  INDEX idx_exam_records_exam_id (exam_id)
);

-- ❌ 错误的设计（物理外键）
CREATE TABLE exam_records (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) NOT NULL,
  exam_id VARCHAR(25) NOT NULL,
  
  -- ❌ 不要使用物理外键
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);
```

#### Prisma Schema（无 @relation）

```prisma
// ✅ 正确的 Prisma 模型
model ExamRecord {
  id        String   @id @default(cuid())
  userId    String   // 逻辑外键，指向 User.id
  examId    String   // 逻辑外键，指向 Exam.id
  score     Float
  createdAt DateTime @default(now())
  
  // ❌ 不定义 @relation，避免生成物理外键
  // user      User     @relation(fields: [userId], references: [id])
  // exam      Exam     @relation(fields: [examId], references: [id])
  
  @@index([userId])
  @@index([examId])
  @@map("exam_records")
}
```

#### 应用层数据完整性验证（推荐方式）

```typescript
// ✅ Service 层验证（最佳实践）
@Injectable()
export class ExamRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataIntegrityService: DataIntegrityService,
  ) {}

  async create(dto: CreateExamRecordDto) {
    // 1. 验证并获取用户（一次查询，同时验证存在性和获取数据）
    const user = await this.dataIntegrityService.validateAndGetUser(dto.userId, {
      include: { role: true }  // 可以同时获取关联数据
    });
    
    // 2. 验证并获取考试
    const exam = await this.dataIntegrityService.validateAndGetExam(dto.examId);
    
    // 3. 业务逻辑验证（使用已查到的数据，无需再次查询）
    if (!user.isActive) {
      throw new BadRequestException('用户账号未激活');
    }
    
    if (exam.endTime && new Date() > exam.endTime) {
      throw new BadRequestException('考试已结束');
    }
    
    // 4. 创建记录
    return this.prisma.examRecord.create({ data: dto });
  }

  async delete(id: string) {
    // 删除前检查
    const { canDelete, reason } = await this.dataIntegrityService.canDeleteUser(id);
    
    if (!canDelete) {
      // 软删除
      await this.dataIntegrityService.softDeleteUser(id);
      return { message: '用户已停用（软删除）', reason };
    }
    
    // 硬删除
    await this.prisma.examRecord.delete({ where: { id } });
    return { message: '记录已删除' };
  }
}
```

#### 批量验证

```typescript
// 批量验证题目ID
async createPracticeRecord(dto: CreatePracticeDto) {
  // 批量验证多个题目是否存在（一次查询）
  await this.dataIntegrityService.validateQuestionsExist(dto.questionIds);
  
  return this.prisma.practiceRecord.create({
    data: {
      userId: dto.userId,
      questions: dto.questionIds,
    },
  });
}
```

#### 软删除机制

```typescript
// 检查是否可以安全删除
async deleteUser(id: string) {
  const { canDelete, reason } = await this.dataIntegrityService.canDeleteUser(id);
  
  if (!canDelete) {
    // 使用软删除
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${id}@deleted.com`, // 避免唯一约束冲突
      },
    });
    return { message: '用户已停用', reason };
  }
  
  // 可以安全删除
  await this.prisma.user.delete({ where: { id } });
  return { message: '用户已删除' };
}

// 查询时过滤软删除数据
async findActiveUsers() {
  return this.prisma.user.findMany({
    where: { 
      isActive: true,
      deletedAt: null,
    },
  });
}
```

#### 孤儿数据清理

```typescript
// 定期清理孤儿数据（定时任务）
@Cron('0 2 * * *') // 每天凌晨2点
async cleanupOrphanedData() {
  const result = await this.dataIntegrityService.cleanupOrphanedData();
  this.logger.log('孤儿数据清理完成', result);
}
```

#### 性能优化

```typescript
// ✅ 一次查询，同时验证和获取数据
const user = await this.dataIntegrityService.validateAndGetUser(userId);
// 无需再次查询

// ❌ 避免多次查询
const exists = await this.validateUserExists(userId); // 第一次查询
const user = await this.findUser(userId);             // 第二次查询（浪费！）

// ✅ 批量验证（一次查询）
await this.dataIntegrityService.validateQuestionsExist([id1, id2, id3]);

// ❌ 避免循环查询（N+1 问题）
for (const id of questionIds) {
  await this.validateQuestionExists(id); // N 次查询（性能差！）
}
```

---

### 错误处理

#### 标准异常

```typescript
import { 
  BadRequestException, 
  UnauthorizedException, 
  ForbiddenException, 
  NotFoundException 
} from '@nestjs/common';

// 400 - 请求参数错误
throw new BadRequestException('用户名已存在');

// 401 - 未认证
throw new UnauthorizedException('请先登录');

// 403 - 无权限
throw new ForbiddenException('权限不足');

// 404 - 资源不存在
throw new NotFoundException('用户不存在');
```

#### 自定义异常

```typescript
export class BusinessException extends HttpException {
  constructor(message: string, code?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        code: code || 'BUSINESS_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 使用
throw new BusinessException('库存不足', 'INSUFFICIENT_STOCK');
```

#### 全局异常过滤器

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus?.() || 500;
    const message = exception.message || '服务器错误';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

## 第四部分：高级特性

### Spring Boot 风格装饰器

#### @Cacheable - 缓存

```typescript
import { Cacheable } from '@/shared/decorators/cacheable.decorator';

@Injectable()
export class UsersService {
  @Cacheable('user', { ttl: 300 })
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

#### @Transactional - 事务

```typescript
import { Transactional } from '@/shared/decorators/transactional.decorator';

@Injectable()
export class OrdersService {
  @Transactional()
  async createOrder(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({ data: dto });
    await this.prisma.inventory.update({ /* ... */ });
    await this.prisma.payment.create({ /* ... */ });
    return order;
  }
}
```

#### @Retry - 重试

```typescript
import { Retry } from '@/shared/decorators/retry.decorator';

@Injectable()
export class PaymentService {
  @Retry({ maxAttempts: 3, delay: 1000 })
  async processPayment(orderId: string) {
    return this.paymentGateway.charge(orderId);
  }
}
```

#### @Scheduled - 定时任务

```typescript
import { Scheduled } from '@/shared/decorators/scheduled.decorator';

@Injectable()
export class ReportService {
  @Scheduled({ cron: '0 0 * * *' })
  async generateDailyReport() {
    // 每天零点执行
  }

  @Scheduled({ fixedRate: 60000 })
  async syncData() {
    // 每分钟执行一次
  }
}
```

#### @CircuitBreaker - 熔断器

```typescript
import { CircuitBreaker } from '@/shared/decorators/circuit-breaker.decorator';

@Injectable()
export class ExternalApiService {
  @CircuitBreaker({ 
    threshold: 5, 
    timeout: 10000,
    fallback: () => ({ data: [] })
  })
  async fetchData() {
    return this.httpService.get('https://api.external.com/data');
  }
}
```

#### @RateLimit - 限流

```typescript
import { RateLimit } from '@/shared/decorators/rate-limit.decorator';

@Controller('api')
export class ApiController {
  @Post('action')
  @RateLimit({ points: 10, duration: 60 })
  async action() {
    // 限制每分钟10次
  }
}
```

---

### 微服务架构

#### 架构设计（tRPC + gRPC）

```
┌─────────────────────────────────────────┐
│            前端应用                      │
│        (React / React Native)          │
└──────────────┬──────────────────────────┘
               │
               │ tRPC (类型安全)
               │ HTTP/JSON
               ▼
       ┌─────────────────┐
       │  API Gateway     │  ← BFF (Backend for Frontend)
       │   (NestJS)       │     • 提供 tRPC 路由
       │                  │     • 调用 gRPC 微服务
       │  presentation/   │     • 转换响应
       └────────┬─────────┘
                │
    ┌───────────┼───────────────┐
    │ gRPC      │ gRPC          │ gRPC
    ▼           ▼               ▼
┌─────────┐ ┌─────────┐ ┌──────────────┐
│ 用户服务 │ │ 考试服务 │ │   题目服务    │
│:50051   │ │:50052   │ │   :50053     │
└─────────┘ └─────────┘ └──────────────┘
     │           │               │
     └───────────┴───────────────┘
                 │
                 ▼
          ┌─────────────┐
          │ PostgreSQL  │
          └─────────────┘
```

#### 为什么这样设计？

| 层级 | 协议 | 原因 |
|-----|------|------|
| **前端 ↔ API Gateway** | tRPC | ✅ 类型安全<br>✅ 开发体验好<br>✅ 自动类型推导 |
| **API Gateway ↔ 微服务** | gRPC | ✅ 高性能（二进制）<br>✅ 跨语言支持<br>✅ 流式传输 |

**前端类型来源**: ✅ tRPC（不是 gRPC）

---

#### 1. Protocol Buffer 定义

```protobuf
// proto/exam.proto
syntax = "proto3";

package exam;

service ExamService {
  rpc Create(CreateExamRequest) returns (ExamResponse);
  rpc FindById(ExamIdRequest) returns (ExamResponse);
  rpc List(ListExamsRequest) returns (ListExamsResponse);
}

message CreateExamRequest {
  string title = 1;
  string description = 2;
  int32 duration = 3;
  float totalScore = 4;
}

message ExamResponse {
  string id = 1;
  string title = 2;
  string description = 3;
  int32 duration = 4;
  float totalScore = 5;
  string status = 6;
}

message ListExamsResponse {
  repeated ExamResponse exams = 1;
  int32 total = 2;
  int32 page = 3;
}
```

---

#### 2. API Gateway 层（tRPC → gRPC）

```typescript
// presentation/routers/exams.router.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { router, protectedProcedure } from '../../core/trpc/trpc';
import { z } from 'zod';
import { firstValueFrom } from 'rxjs';

// ✅ Zod 验证（前端输入）
const createExamSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  totalScore: z.number().positive(),
});

@Injectable()
export class ExamsRouter implements OnModuleInit {
  private examService: any;

  constructor(
    @Inject('EXAM_SERVICE') private grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    // 获取 gRPC 服务实例
    this.examService = this.grpcClient.getService('ExamService');
  }

  router = router({
    // ✅ tRPC 接口（前端调用）
    create: protectedProcedure
      .input(createExamSchema)
      .mutation(async ({ input, ctx }) => {
        // 调用 gRPC 微服务
        const result = await firstValueFrom(
          this.examService.create({
            title: input.title,
            description: input.description || '',
            duration: input.duration,
            totalScore: input.totalScore,
          })
        );
        
        return result; // 返回给前端（tRPC 自动处理类型）
      }),

    // 获取列表
    list: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      }))
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.examService.list({
            page: input.page,
            limit: input.limit,
            status: '',
          })
        );
        
        return {
          exams: result.exams,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
          },
        };
      }),
  });
}
```

---

#### 3. 微服务层（gRPC 服务端）

```typescript
// microservices/exam-service/exam-grpc.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class ExamGrpcController {
  constructor(private examsService: ExamsService) {}

  @GrpcMethod('ExamService', 'Create')
  async create(data: {
    title: string;
    description: string;
    duration: number;
    totalScore: number;
  }) {
    const exam = await this.examsService.create(data);
    
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      totalScore: exam.totalScore,
      status: exam.status,
    };
  }

  @GrpcMethod('ExamService', 'List')
  async list(data: { page: number; limit: number; status: string }) {
    const result = await this.examsService.findAll(data);
    
    return {
      exams: result.data,
      total: result.total,
      page: data.page,
      limit: data.limit,
    };
  }
}
```

---

#### 4. 微服务启动

```typescript
// microservices/exam-service/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ExamServiceModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'exam',
        protoPath: join(__dirname, '../../../proto/exam.proto'),
        url: '0.0.0.0:50052',
      },
    },
  );

  await app.listen();
  console.log('🚀 Exam Service is running on :50052');
}

bootstrap();
```

---

#### 5. 微服务客户端配置

```typescript
// infrastructure/microservices/microservices.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EXAM_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'exam',
          protoPath: join(__dirname, '../../../proto/exam.proto'),
          url: 'localhost:50052',
        },
      },
      {
        name: 'QUESTION_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'question',
          protoPath: join(__dirname, '../../../proto/question.proto'),
          url: 'localhost:50053',
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}
```

---

#### 6. 前端使用（完全透明）

```typescript
// ✅ 前端只使用 tRPC，完全不知道后端用了 gRPC
import { trpc } from './trpc';

// 创建考试（类型安全！）
const exam = await trpc.exams.create.mutate({
  title: '期末考试',
  duration: 120,
  totalScore: 100,
});

// exam 有完整的 TypeScript 类型（来自 tRPC，不是 gRPC）
console.log(exam.id, exam.title);

// 获取列表
const result = await trpc.exams.list.query({
  page: 1,
  limit: 10,
});
```

---

#### 7. Docker 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - EXAM_SERVICE_URL=exam-service:50052
      - QUESTION_SERVICE_URL=question-service:50053

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

  # 数据库
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: quiz
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
```

---

#### 8. 服务端口分配

| 服务 | 端口 | 协议 | 说明 |
|-----|------|------|------|
| **API Gateway** | 3000 | HTTP/tRPC | 前端访问入口 |
| **User Service** | 50051 | gRPC | 用户微服务 |
| **Exam Service** | 50052 | gRPC | 考试微服务 |
| **Question Service** | 50053 | gRPC | 题目微服务 |

---

#### 服务发现（Consul - 可选）

```typescript
// 注册服务到 Consul
await this.consulService.registerService({
  name: 'exam-service',
  address: 'localhost',
  port: 50052,
  check: {
    grpc: 'localhost:50052',
    interval: '10s',
  },
});

// 发现服务
const services = await this.consulService.getService('exam-service');
const serviceUrl = `${services[0].address}:${services[0].port}`;
```

---

### 性能优化

#### 数据库优化

```typescript
// ✅ 使用索引
@@index([userId])
@@index([createdAt])
@@index([userId, createdAt]) // 复合索引

// ✅ 选择必要字段
const users = await this.prisma.user.findMany({
  select: { id: true, username: true, email: true },
});

// ✅ 避免 N+1 查询
const users = await this.prisma.user.findMany({
  include: {
    role: true,
    permissions: true,
  },
});

// ❌ N+1 查询问题
const users = await this.prisma.user.findMany();
for (const user of users) {
  user.role = await this.prisma.role.findUnique({ where: { id: user.roleId } });
}
```

#### 缓存策略

```typescript
// Redis 缓存
@Cacheable('user', { ttl: 300 })
async findById(id: string) {
  return this.prisma.user.findUnique({ where: { id } });
}

// 缓存失效
@CacheEvict('user')
async update(id: string, dto: UpdateUserDto) {
  return this.prisma.user.update({ where: { id }, data: dto });
}
```

#### 分页优化

```typescript
// ✅ 游标分页（性能好）
async findAllCursor(cursor?: string, limit: number = 10) {
  return this.prisma.user.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

// ⚠️ 偏移分页（数据量大时性能差）
async findAllOffset(page: number = 1, limit: number = 10) {
  return this.prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

---

### 监控与日志

#### Prometheus 指标

```typescript
// metrics.service.ts
export class MetricsService {
  private httpRequestCounter: Counter;
  private httpRequestDuration: Histogram;

  recordHttpRequest(method: string, path: string, status: number, duration: number) {
    this.httpRequestCounter.inc({
      method,
      path,
      status,
    });

    this.httpRequestDuration.observe(
      { method, path },
      duration / 1000,
    );
  }
}
```

#### 结构化日志

```typescript
this.logger.log('用户登录成功', {
  userId: user.id,
  ip: request.ip,
  userAgent: request.get('User-Agent'),
  timestamp: new Date().toISOString(),
});
```

#### Sentry 错误监控

```typescript
try {
  await this.processPayment(order);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      service: 'payment',
      orderId: order.id,
    },
  });
  throw error;
}
```

---

## 第五部分：部署运维

### Docker 部署

#### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["node", "dist/main"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/quiz
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: quiz
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

### 环境配置

#### .env 配置

```bash
# 应用配置
NODE_ENV=production
PORT=3000
APP_URL=https://api.example.com

# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/quiz

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# 邮件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# 文件上传
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760
```

---

### 健康检查

#### 健康检查端点

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // 数据库检查
      () => this.db.pingCheck('database'),
      
      // 磁盘空间检查
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9 
      }),
      
      // 内存检查
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
```

#### Kubernetes 探针

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    image: quiz-api:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
```

---

### 故障排查

#### 常见问题

**1. 数据库连接失败**

```bash
# 检查数据库连接
psql -h localhost -U user -d quiz

# 检查 Prisma 配置
npx prisma studio
```

**2. Redis 连接失败**

```bash
# 检查 Redis
redis-cli ping

# 查看 Redis 日志
docker logs redis
```

**3. 性能问题**

```bash
# 查看慢查询
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# 查看数据库连接数
SELECT count(*) FROM pg_stat_activity;
```

#### 日志查询

```bash
# Docker 日志
docker logs -f app

# 按时间过滤
docker logs --since 1h app

# 按关键字过滤
docker logs app | grep ERROR
```

---

## 附录

### API 文档

- **Swagger UI**: http://localhost:3000/api/docs
- **Redoc**: http://localhost:3000/api/redoc

### 快速命令

```bash
# 开发
npm run start:dev

# 构建
npm run build

# 生产环境
npm run start:prod

# 测试
npm run test
npm run test:e2e
npm run test:cov

# 数据库
npx prisma generate
npx prisma db push
npx prisma studio
npx ts-node prisma/seed.ts

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### 学习资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
- [tRPC 文档](https://trpc.io/docs)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

---

## 🎉 总结

本指南涵盖了 AI Quiz System 从快速开始到生产部署的完整流程：

✅ **快速上手** - 5分钟启动项目  
✅ **核心功能** - 认证、权限、审计、上传、邮件、队列  
✅ **开发规范** - 代码规范、模块开发、数据验证  
✅ **高级特性** - Spring Boot 风格装饰器、微服务  
✅ **部署运维** - Docker、监控、故障排查

### 下一步

1. ⭐ 实现业务模块（exams、questions、practice）
2. 📚 完善单元测试和集成测试
3. 🚀 部署到生产环境
4. 📊 接入监控和告警

**Happy Coding! 🎈**

