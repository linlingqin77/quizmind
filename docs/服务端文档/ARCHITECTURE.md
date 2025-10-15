# 🏗️ AI智能题库系统 - 完整架构文档

> **版本：** V1.0  
> **更新日期：** 2025-10-14  
> **技术栈：** NestJS + gRPC + tRPC + React Native + PostgreSQL

---

## 📋 目录

1. [系统架构总览](#系统架构总览)
2. [微服务拆分](#微服务拆分)
3. [技术栈详解](#技术栈详解)
4. [监控与日志](#监控与日志)
5. [部署架构](#部署架构)
6. [快速开始](#快速开始)
7. [开发指南](#开发指南)

---

## 📐 系统架构总览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          客户端层 (Client Layer)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐              ┌──────────────────┐            │
│  │  iOS App         │              │  Android App     │            │
│  │  (React Native)  │              │  (React Native)  │            │
│  │  学员端          │              │  学员端          │            │
│  └────────┬─────────┘              └────────┬─────────┘            │
│           │                                  │                       │
│           └──────────────┬───────────────────┘                       │
│                          │                                           │
│               tRPC over HTTP/JSON (类型安全)                          │
│                          │                                           │
│  ┌───────────────────────▼────────────────────┐                     │
│  │         React Web Admin                     │                     │
│  │         (老师端管理后台)                    │                     │
│  └───────────────────────┬────────────────────┘                     │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                      API Gateway Layer                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              NestJS API Gateway (Port 3000)                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
│  │  │ tRPC Server│  │   Auth     │  │  Metrics   │            │   │
│  │  │   Routes   │  │  Passport  │  │ Prometheus │            │   │
│  │  └────────────┘  └────────────┘  └────────────┘            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
│  │  │   CORS     │  │Rate Limiter│  │  Tracing   │            │   │
│  │  │   Guard    │  │  Sentinel  │  │   Jaeger   │            │   │
│  │  └────────────┘  └────────────┘  └────────────┘            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                    gRPC (Protocol Buffers)
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                   Microservices Layer (微服务层)                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ User Service │  │ Exam Service │  │Question Svc  │              │
│  │  Port 50051  │  │  Port 50052  │  │  Port 50053  │              │
│  │              │  │              │  │              │              │
│  │ • 用户管理   │  │ • 考试管理   │  │ • 题库管理   │              │
│  │ • 认证授权   │  │ • 监考防作弊 │  │ • 多级分类   │              │
│  │ • RBAC权限   │  │ • 成绩管理   │  │ • 标签搜索   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Paper Service│  │  AI Service  │  │Practice Svc  │              │
│  │  Port 50054  │  │  Port 50055  │  │  Port 50056  │              │
│  │              │  │              │  │              │              │
│  │ • 试卷组卷   │  │ • AI批改     │  │ • 6种练习模式│              │
│  │ • 智能组卷   │  │ • AI出题     │  │ • 错题本     │              │
│  │ • 模拟考试   │  │ • DeepSeek   │  │ • 收藏夹     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │Analytics Svc │  │ Social Svc   │  │Document Svc  │              │
│  │  Port 50057  │  │  Port 50058  │  │  Port 50059  │              │
│  │              │  │              │  │              │              │
│  │ • 数据分析   │  │ • 排行榜     │  │ • 文档解析   │              │
│  │ • 学习曲线   │  │ • PK对战     │  │ • OCR识别    │              │
│  │ • 能力雷达图 │  │ • 讨论区     │  │ • PDF提取    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                    Infrastructure Layer (基础设施层)                  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Service Mesh & Registry                    │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │
│  │  │   Consul   │  │  Jaeger    │  │Load Balance│             │   │
│  │  │  注册中心  │  │  链路追踪  │  │  6种算法   │             │   │
│  │  │  Port 8500 │  │ Port 16686 │  │            │             │   │
│  │  └────────────┘  └────────────┘  └────────────┘             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Monitoring Stack                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │
│  │  │ Prometheus │  │  Grafana   │  │Alertmanager│             │   │
│  │  │  指标收集  │  │  可视化    │  │  告警管理  │             │   │
│  │  │  Port 9090 │  │ Port 3001  │  │  Port 9093 │             │   │
│  │  └────────────┘  └────────────┘  └────────────┘             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                       Logging Stack                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │
│  │  │Elasticsearch│ │  Logstash  │  │   Kibana   │             │   │
│  │  │  日志存储  │  │  日志收集  │  │  日志查询  │             │   │
│  │  │  Port 9200 │  │  Port 5000 │  │  Port 5601 │             │   │
│  │  └────────────┘  └────────────┘  └────────────┘             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Data Storage Layer                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │
│  │  │PostgreSQL 16│ │  Redis 7   │  │  Pinecone  │             │   │
│  │  │  主数据库  │  │  缓存/队列 │  │  向量数据库│             │   │
│  │  │  Port 5432 │  │  Port 6379 │  │  (Cloud)   │             │   │
│  │  └────────────┘  └────────────┘  └────────────┘             │   │
│  │  ┌────────────┐                                               │   │
│  │  │ OSS/S3     │  文件存储 (阿里云OSS/AWS S3)                  │   │
│  │  └────────────┘                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      External Services                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │   │
│  │  │ DeepSeek   │  │   Email    │  │    SMS     │             │   │
│  │  │  AI服务    │  │  邮件服务  │  │  短信服务  │             │   │
│  │  └────────────┘  └────────────┘  └────────────┘             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 数据流图

```
┌─────────┐
│ 用户操作 │
└────┬────┘
     │
     ▼
┌─────────────────┐
│   React Native  │  1. 用户登录
│   (移动端)      │  ──────────────────┐
└────┬────────────┘                     │
     │ tRPC Request                     │
     ▼                                  ▼
┌─────────────────┐              ┌──────────────┐
│  API Gateway    │  2. JWT验证  │ User Service │
│  (NestJS)       │ ◄────────────│  (gRPC)      │
└────┬────────────┘              └──────────────┘
     │                                  │
     │ 3. 调用其他服务                  │
     ├──────────────┬──────────────────┤
     │              │                  │
     ▼              ▼                  ▼
┌──────────┐  ┌──────────┐      ┌──────────┐
│ Question │  │   Exam   │      │Practice  │
│ Service  │  │ Service  │      │ Service  │
└────┬─────┘  └────┬─────┘      └────┬─────┘
     │             │                   │
     └─────────────┼───────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  PostgreSQL  │  4. 数据持久化
            │  (数据库)    │
            └──────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  Redis       │  5. 缓存/队列
            │  (缓存)      │
            └──────────────┘
```

### 服务间通信图

```
┌────────────┐
│API Gateway │
└──────┬─────┘
       │
       │ gRPC调用
       │
       ├───────────────┬───────────────┬─────────────┐
       │               │               │             │
       ▼               ▼               ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│User Service │ │Exam Service │ │   AI Svc    │ │Question Svc │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │               │
       │               │               │               │
       │               └───────────────┼───────────────┘
       │                               │
       │                               ▼
       │                        ┌─────────────┐
       │                        │Document Svc │ ◄─── OCR/PDF解析
       │                        └─────────────┘
       │
       └───────────────┬───────────────┐
                       │               │
                       ▼               ▼
                ┌─────────────┐ ┌─────────────┐
                │Practice Svc │ │Analytics Svc│
                └─────────────┘ └─────────────┘

说明：
- 实线：同步gRPC调用
- 虚线：异步消息队列
- User Service是认证中心，被所有服务依赖
```

---

## 🎯 微服务拆分

### 服务清单

| 服务名称 | 端口 | 职责 | 技术栈 |
|---------|------|------|--------|
| **API Gateway** | 3000 | 统一入口、路由、鉴权 | NestJS + tRPC |
| **User Service** | 50051 | 用户管理、认证授权、RBAC | NestJS + gRPC + Prisma |
| **Exam Service** | 50052 | 考试管理、监考、成绩 | NestJS + gRPC + Prisma |
| **Question Service** | 50053 | 题库管理、分类、搜索 | NestJS + gRPC + Prisma |
| **Paper Service** | 50054 | 组卷、智能组卷、模拟卷 | NestJS + gRPC + Prisma |
| **AI Service** | 50055 | AI批改、出题、推荐 | NestJS + gRPC + DeepSeek |
| **Practice Service** | 50056 | 练习模式、错题本、收藏 | NestJS + gRPC + Prisma |
| **Analytics Service** | 50057 | 数据分析、学习曲线 | NestJS + gRPC + Prisma |
| **Social Service** | 50058 | 排行榜、PK对战、讨论区 | NestJS + gRPC + Prisma |
| **Document Service** | 50059 | 文档解析、OCR识别 | NestJS + gRPC + Tesseract |

### 服务依赖关系

```
User Service (认证中心)
    ↑
    │ 所有服务都依赖（验证Token）
    │
    ├─── Exam Service
    │       ↓
    │    Question Service (获取题目)
    │       ↓
    │    Paper Service (获取试卷)
    │       ↓
    │    Analytics Service (记录统计)
    │
    ├─── AI Service
    │       ↓
    │    Document Service (文档解析)
    │       ↓
    │    Question Service (创建题目)
    │
    └─── Practice Service
            ↓
         Analytics Service (练习统计)
```

---

## 💻 技术栈详解

### 后端技术栈

```
┌──────────────────────────────────────────┐
│         NestJS 10 + TypeScript 5         │
├──────────────────────────────────────────┤
│                                          │
│  核心框架                                │
│  ├─ @nestjs/core                        │
│  ├─ @nestjs/common                      │
│  ├─ @nestjs/microservices               │
│  └─ @nestjs/platform-express            │
│                                          │
│  数据库 & ORM                            │
│  ├─ Prisma 5 (ORM)                      │
│  ├─ PostgreSQL 16 (主数据库)            │
│  ├─ Redis 7 (缓存/队列)                 │
│  └─ Pinecone (向量数据库)               │
│                                          │
│  微服务通信                              │
│  ├─ gRPC (@grpc/grpc-js)                │
│  ├─ Protocol Buffers                    │
│  └─ tRPC (端到端类型安全)               │
│                                          │
│  AI & 机器学习                           │
│  ├─ DeepSeek API                        │
│  ├─ LangChain.js                        │
│  └─ @xenova/transformers                │
│                                          │
│  监控 & 日志                             │
│  ├─ prom-client (Prometheus)            │
│  ├─ @elastic/elasticsearch              │
│  ├─ @opentelemetry/api                  │
│  └─ winston                             │
│                                          │
│  消息队列                                │
│  ├─ Bull                                │
│  └─ ioredis                             │
│                                          │
│  文档处理                                │
│  ├─ pdf-parse                           │
│  ├─ mammoth                             │
│  ├─ pptx-parser                         │
│  └─ tesseract.js                        │
│                                          │
│  工具库                                  │
│  ├─ bcrypt (密码加密)                   │
│  ├─ jsonwebtoken (JWT)                  │
│  ├─ joi (数据验证)                      │
│  └─ dayjs (时间处理)                    │
│                                          │
└──────────────────────────────────────────┘
```

### 移动端技术栈

```
┌──────────────────────────────────────────┐
│      React Native + TypeScript           │
├──────────────────────────────────────────┤
│                                          │
│  核心框架                                │
│  ├─ React Native 0.72+                  │
│  ├─ TypeScript 5                        │
│  └─ Metro Bundler                       │
│                                          │
│  导航                                    │
│  └─ React Navigation 6                  │
│                                          │
│  状态管理                                │
│  ├─ Redux Toolkit                       │
│  └─ React Query (数据获取)              │
│                                          │
│  API通信                                 │
│  ├─ tRPC Client                         │
│  └─ React Query                         │
│                                          │
│  UI组件                                  │
│  ├─ React Native Paper                  │
│  └─ React Native Vector Icons           │
│                                          │
│  工具库                                  │
│  ├─ AsyncStorage (本地存储)             │
│  ├─ react-native-image-picker           │
│  └─ react-native-chart-kit              │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📊 监控与日志系统

### 监控架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Application)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐                                       │
│  │ Metrics      │  PrometheusMetricsService             │
│  │ Interceptor  │  自动收集HTTP/gRPC指标                │
│  └──────┬───────┘                                       │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Prometheus Metrics (/metrics endpoint)          │  │
│  │  ├─ http_requests_total                          │  │
│  │  ├─ http_request_duration_seconds                │  │
│  │  ├─ grpc_calls_total                             │  │
│  │  ├─ db_queries_total                             │  │
│  │  ├─ cache_hits_total / cache_misses_total        │  │
│  │  └─ ai_tokens_used_total                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 Prometheus (Port 9090)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • 15秒抓取一次指标                              │  │
│  │  • 时序数据库存储                                │  │
│  │  • PromQL查询语言                                │  │
│  │  • 告警规则评估                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
         ┌────────────┴────────────┬─────────────┐
         ▼                         ▼             ▼
┌─────────────────┐     ┌─────────────────┐  ┌─────────────────┐
│   Grafana       │     │  Alertmanager   │  │  Third Party    │
│   (Port 3001)   │     │   (Port 9093)   │  │   Exporters     │
│  ┌───────────┐  │     │  ┌───────────┐  │  │  ┌───────────┐  │
│  │Dashboards │  │     │  │ Alerts    │  │  │  │Node       │  │
│  │Panels     │  │     │  │ Routing   │  │  │  │Exporter   │  │
│  │Queries    │  │     │  │ Grouping  │  │  │  └───────────┘  │
│  └───────────┘  │     │  │ Silencing │  │  │  ┌───────────┐  │
└─────────────────┘     │  └───────────┘  │  │  │Postgres   │  │
                        │        │         │  │  │Exporter   │  │
                        └────────┼─────────┘  │  └───────────┘  │
                                 │            │  ┌───────────┐  │
                                 ▼            │  │Redis      │  │
                        ┌─────────────────┐  │  │Exporter   │  │
                        │  Notifications  │  │  └───────────┘  │
                        │  ├─ Slack       │  └─────────────────┘
                        │  ├─ Email       │
                        │  └─ Webhook     │
                        └─────────────────┘
```

### 日志架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Application)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ElasticsearchLoggerService                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • 统一日志格式                                  │  │
│  │  • TraceId关联                                   │  │
│  │  • 批量写入                                      │  │
│  │  • 自动刷新                                      │  │
│  └──────────────────────────────────────────────────┘  │
│         │                                                │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│               Logstash (Port 5000, 5044)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Input:                                          │  │
│  │  ├─ HTTP (5000)                                  │  │
│  │  └─ TCP (5044)                                   │  │
│  │                                                  │  │
│  │  Filter:                                         │  │
│  │  ├─ 解析timestamp                                │  │
│  │  ├─ GeoIP (地理位置)                             │  │
│  │  └─ 标签处理                                     │  │
│  │                                                  │  │
│  │  Output:                                         │  │
│  │  ├─ Elasticsearch                                │  │
│  │  └─ Stdout (调试)                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│            Elasticsearch (Port 9200)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Index: logs-{service}-{date}                    │  │
│  │  ├─ timestamp                                    │  │
│  │  ├─ level                                        │  │
│  │  ├─ service                                      │  │
│  │  ├─ traceId                                      │  │
│  │  ├─ message                                      │  │
│  │  └─ metadata                                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                Kibana (Port 5601)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Discover (日志查询)                           │  │
│  │  • Dashboard (可视化)                            │  │
│  │  • Index Pattern (索引模式)                      │  │
│  │  • Search (全文搜索)                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 链路追踪架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Application)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  JaegerTracerService (OpenTelemetry)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • startActiveSpan()                             │  │
│  │  • getCurrentTraceId()                           │  │
│  │  • injectContext() - gRPC Metadata              │  │
│  │  • extractContext()                              │  │
│  └──────────────────────────────────────────────────┘  │
│         │                                                │
│         │ OTLP (OpenTelemetry Protocol)                 │
│         ▼                                                │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│            Jaeger Collector (Port 14268)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • 接收Span数据                                  │  │
│  │  • 存储到后端                                    │  │
│  │  • 采样策略                                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Jaeger Query (Port 16686)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  UI Features:                                    │  │
│  │  ├─ 服务依赖图                                   │  │
│  │  ├─ Trace时间线                                  │  │
│  │  ├─ Span详情                                     │  │
│  │  └─ 性能分析                                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Trace示例：
TraceID: abc123
  ├─ Span: API Gateway (10ms)
  │   ├─ Span: User Service - ValidateToken (2ms)
  │   ├─ Span: Exam Service - GetExam (5ms)
  │   │   └─ Span: Question Service - GetQuestions (3ms)
  │   └─ Span: Analytics Service - RecordView (1ms)
```

---

## 🚀 部署架构

### Docker Compose部署

```yaml
# 完整的监控栈部署
services:
  # 服务注册与发现
  - consul (8500)
  
  # API Gateway
  - api-gateway (3000)
  
  # 微服务
  - user-service (50051)
  - exam-service (50052)
  - question-service (50053)
  - paper-service (50054)
  - ai-service (50055)
  - practice-service (50056)
  - analytics-service (50057)
  - social-service (50058)
  - document-service (50059)
  
  # 监控
  - prometheus (9090)
  - grafana (3001)
  - alertmanager (9093)
  - jaeger (16686)
  
  # 日志
  - elasticsearch (9200)
  - logstash (5000)
  - kibana (5601)
  
  # 数据库
  - postgres (5432)
  - redis (6379)
  
  # Exporters
  - node-exporter (9100)
  - postgres-exporter (9187)
  - redis-exporter (9121)
```

### Kubernetes部署（推荐生产）

```
┌──────────────────────────────────────────┐
│         Kubernetes Cluster                │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Namespace: ai-quiz-system         │ │
│  │                                    │ │
│  │  Deployments:                      │ │
│  │  ├─ api-gateway (replicas: 3)     │ │
│  │  ├─ user-service (replicas: 2)    │ │
│  │  ├─ exam-service (replicas: 2)    │ │
│  │  └─ ... (其他微服务)               │ │
│  │                                    │ │
│  │  Services:                         │ │
│  │  ├─ LoadBalancer (对外)           │ │
│  │  └─ ClusterIP (内部)              │ │
│  │                                    │ │
│  │  ConfigMaps:                       │ │
│  │  ├─ app-config                    │ │
│  │  └─ prometheus-config             │ │
│  │                                    │ │
│  │  Secrets:                          │ │
│  │  ├─ db-credentials                │ │
│  │  └─ api-keys                      │ │
│  │                                    │ │
│  │  Ingress:                          │ │
│  │  └─ Nginx Ingress Controller      │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Namespace: monitoring             │ │
│  │  ├─ Prometheus Operator            │ │
│  │  ├─ Grafana                        │ │
│  │  └─ ELK Stack                      │ │
│  └────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

---

## ⚡ 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd packages/server
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动监控栈

```bash
./scripts/start-monitoring.sh
```

### 4. 启动微服务

```bash
# 启动所有服务
npm run start:all

# 或单独启动
npm run start:user-service
npm run start:exam-service
# ...
```

### 5. 访问监控面板

- 📊 Grafana: http://localhost:3001 (admin/admin)
- 📈 Prometheus: http://localhost:9090
- 🔍 Jaeger: http://localhost:16686
- 📋 Kibana: http://localhost:5601
- 🔵 Consul: http://localhost:8500

---

## 📖 开发指南

### 创建新微服务

1. **定义Proto文件**

```protobuf
// proto/my-service.proto
syntax = "proto3";
package myservice;

service MyService {
  rpc DoSomething(Request) returns (Response);
}
```

2. **创建服务目录**

```
src/microservices/my-service/
├── my-service-grpc.controller.ts
├── my-service.service.ts
├── my-service.module.ts
└── main.ts
```

3. **实现gRPC Controller**

```typescript
@Controller()
export class MyServiceGrpcController {
  @GrpcMethod('MyService', 'DoSomething')
  async doSomething(data: any) {
    // 实现逻辑
  }
}
```

4. **启动服务**

```typescript
// main.ts
const app = await NestFactory.createMicroservice(MyServiceModule, {
  transport: Transport.GRPC,
  options: {
    package: 'myservice',
    protoPath: join(__dirname, '../../../proto/my-service.proto'),
    url: '0.0.0.0:50060',
  },
});
```

### 集成监控

```typescript
// 在模块中导入
import { PrometheusMetricsModule } from './common/monitoring/prometheus-metrics.module';
import { LoggingModule } from './common/logging/logging.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

@Module({
  imports: [PrometheusMetricsModule, LoggingModule],
  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: MetricsInterceptor,
  }],
})
```

---

## 📚 相关文档

- [监控使用指南](./MONITORING_GUIDE.md)
- [微服务列表](./src/microservices/README.md)
- [开发指南](./COMPLETE_GUIDE.md)

---

**架构版本：** V1.0  
**最后更新：** 2025-10-14  
**维护团队：** AI Quiz Development Team


