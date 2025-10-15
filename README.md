# 🎓 智题云 QuizMind

> AI智能题库学习平台

> 企业级全栈应用 | NestJS微服务 + React Native | AI赋能 | 生产就绪

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![React Native](https://img.shields.io/badge/React%20Native-0.82-61DAFB.svg)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ⚡ 30秒快速开始

```bash
# 克隆项目
git clone <repository-url> && cd quizmind/packages/server

# 启动监控栈
chmod +x scripts/*.sh && ./scripts/start-monitoring.sh

# 启动服务端
npm install && npm run start:dev

# 启动移动端
cd ../mobile && npm install && npm run ios  # 或 android
```

**访问地址：**
- 📊 Grafana: http://localhost:3001 (admin/admin)
- 🔍 Jaeger: http://localhost:16686
- 📋 Kibana: http://localhost:5601
- 🚀 API: http://localhost:3000

---

## 📚 完整文档

**选择你需要的文档：**

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| **[📱 前端完整开发指南](./docs/前端完整开发指南.md)** | React Native + HTML页面 | 前端开发者 |
| **[🚀 服务端完整开发指南](./docs/服务端完整开发指南.md)** | NestJS + 微服务 + 监控 | 服务端开发者 |
| **[📋 产品需求文档](./docs/产品需求文档(PRD).md)** | 完整的产品需求 | 产品经理 |
| **[🎯 项目管理与排期](./docs/项目管理与排期.md)** | 甘特图、开发计划 | 项目经理 |

### 详细技术文档

**服务端技术栈详解：**
- [完整架构设计](./docs/服务端文档/ARCHITECTURE.md) - 系统架构、微服务拆分
- [架构图集](./docs/服务端文档/ARCHITECTURE_DIAGRAMS.md) - Mermaid可视化图
- [监控系统指南](./docs/服务端文档/MONITORING_GUIDE.md) - Prometheus + Grafana
- [开发手册](./docs/服务端文档/COMPLETE_GUIDE.md) - 1887行详细规范
- [微服务列表](./docs/服务端文档/MICROSERVICES.md) - 9个微服务说明

**其他文档：**
- [竞品分析](./docs/竞品分析与功能补充建议.md)
- [AI提示词库](./docs/AI开发提示词库.md)
- [UI设计图](./docs/ui设计图/)

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────┐
│  客户端层                                        │
│  iOS / Android / Web                            │
├─────────────────────────────────────────────────┤
│  API Gateway (NestJS + tRPC) - Port 3000       │
├─────────────────────────────────────────────────┤
│  微服务层 (gRPC通信)                            │
│  ├─ User Service (50051) - 用户/认证           │
│  ├─ Exam Service (50052) - 考试管理            │
│  ├─ Question Service (50053) - 题库管理        │
│  ├─ Paper Service (50054) - 智能组卷           │
│  ├─ AI Service (50055) - AI批改/出题           │
│  ├─ Practice Service (50056) - 练习模式        │
│  ├─ Analytics Service (50057) - 数据分析       │
│  ├─ Social Service (50058) - 排行榜/PK/讨论    │
│  └─ Document Service (50059) - 文档OCR         │
├─────────────────────────────────────────────────┤
│  基础设施层                                      │
│  Consul | Prometheus | Grafana | Jaeger | ELK  │
├─────────────────────────────────────────────────┤
│  数据层                                          │
│  PostgreSQL | Redis | Pinecone | OSS           │
└─────────────────────────────────────────────────┘
```

**查看完整架构图：** [架构图集](./docs/服务端文档/ARCHITECTURE_DIAGRAMS.md)

---

## ✨ 核心特性

### 🎯 学员端（移动）
- ✅ **6种练习模式** - 顺序/随机/专项/题型/错题/章节
- ✅ **背题模式** - 卡片式、自动翻页、掌握度标记
- ✅ **在线考试** - 监考防作弊、自动评分
- ✅ **错题集** - 智能复习、订正记录
- ✅ **学习分析** - 学习曲线、能力雷达图
- ✅ **社交功能** - 排行榜、PK对战、讨论区

### 👨‍🏫 教师端（Web）
- ✅ **题库管理** - 5种题型、多级分类、批量操作
- ✅ **智能组卷** - AI辅助出题
- ✅ **考试监控** - 实时监考、数据统计
- ✅ **学员管理** - 成绩分析、学习报告

### 🚀 企业级功能
- ✅ **微服务架构** - 9个独立服务、gRPC通信
- ✅ **完整监控** - Prometheus + Grafana + Jaeger + ELK
- ✅ **AI赋能** - DeepSeek批改、智能出题、推荐系统
- ✅ **RBAC权限** - 细粒度权限控制
- ✅ **审计日志** - 完整操作记录
- ✅ **高可用** - 服务注册、负载均衡、熔断器

---

## 💻 技术栈

### 服务端
```
NestJS 10 + TypeScript 5 + PostgreSQL 16 + Redis 7
gRPC + tRPC + Prisma ORM + Consul
Prometheus + Grafana + Jaeger + ELK
DeepSeek AI + LangChain + Pinecone
```

### 移动端
```
React Native 0.82 + TypeScript
React Navigation 6 + Redux Toolkit
React Query + tRPC Client
React Native Paper + Vector Icons
```

### 监控栈
```
Prometheus (指标收集)
Grafana (可视化)
Jaeger (链路追踪)
Elasticsearch + Logstash + Kibana (日志)
Consul (服务注册)
Alertmanager (告警)
```

---

## 📂 项目结构

```
quizmind/
├── docs/                              # 📚 统一文档中心
│   ├── 前端完整开发指南.md            # 前端开发文档
│   ├── 服务端完整开发指南.md          # 服务端开发文档
│   ├── 产品需求文档(PRD).md           # 产品需求
│   ├── 项目管理与排期.md              # 项目管理
│   ├── 服务端文档/                   # 服务端详细文档
│   │   ├── ARCHITECTURE.md           # 完整架构设计
│   │   ├── MONITORING_GUIDE.md       # 监控指南
│   │   └── COMPLETE_GUIDE.md         # 开发手册
│   └── ...
│
├── packages/                          # 项目代码
│   ├── server/                       # NestJS服务端
│   │   ├── src/                      # 源代码
│   │   ├── proto/                    # gRPC Proto
│   │   ├── prisma/                   # 数据库Schema
│   │   └── scripts/                  # 启动脚本
│   │
│   ├── mobile/                        # React Native移动端
│   │   └── src/                      # 源代码
│   │
│   └── shared/                        # 共享类型库
│       └── src/                      # TypeScript类型
│
├── html-pages/                        # Web静态页面
│
└── README.md                          # 📖 本文档
```

---

## 🎯 适合人群

| 角色 | 推荐文档 |
|------|---------|
| **前端开发者** | [前端完整开发指南](./docs/前端完整开发指南.md) |
| **服务端开发者** | [服务端完整开发指南](./docs/服务端完整开发指南.md) |
| **全栈开发者** | 两份开发指南都要看 |
| **架构师** | [完整架构设计](./docs/服务端文档/ARCHITECTURE.md) |
| **运维工程师** | [监控系统指南](./docs/服务端文档/MONITORING_GUIDE.md) |
| **产品经理** | [产品需求文档](./docs/产品需求文档(PRD).md) |
| **项目经理** | [项目管理与排期](./docs/项目管理与排期.md) |

---

## 🚀 快速命令

### 服务端

```bash
cd packages/server

# 开发
npm run start:dev

# 监控
./scripts/start-monitoring.sh

# 微服务
npm run start:user-service
npm run start:exam-service

# 数据库
npx prisma generate
npx prisma db push
npx prisma studio

# 测试
npm run test
npm run test:e2e
```

### 移动端

```bash
cd packages/mobile

# iOS
npm run ios

# Android
npm run android

# 清除缓存
npm start -- --reset-cache
```

### Docker

```bash
# 启动监控栈
docker-compose -f docker-compose.monitoring.yml up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 📊 监控面板

启动监控后访问：

| 服务 | URL | 用户名/密码 | 说明 |
|------|-----|------------|------|
| **Grafana** | http://localhost:3001 | admin/admin | 可视化监控 |
| **Prometheus** | http://localhost:9090 | - | 指标查询 |
| **Jaeger** | http://localhost:16686 | - | 链路追踪 |
| **Kibana** | http://localhost:5601 | - | 日志查询 |
| **Consul** | http://localhost:8500 | - | 服务注册 |

---

## 🧪 测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

---

## 📝 开发规范

### Git提交

```bash
feat: 新功能
fix: Bug修复
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 分支管理

```bash
main - 生产环境
develop - 开发环境
feature/* - 功能分支
hotfix/* - 紧急修复
```

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md)

```bash
# 1. Fork项目
# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交改动
git commit -m "feat: Add amazing feature"

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 开启Pull Request
```

---

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE)

---

## 📞 支持

- 📧 Email: support@example.com
- 💬 Discussions: GitHub Discussions
- 🐛 Issues: GitHub Issues
- 📚 文档: [docs目录](./docs/)

---

## 🙏 致谢

- [NestJS](https://nestjs.com/) - 渐进式Node.js框架
- [React Native](https://reactnative.dev/) - 跨平台移动开发
- [Prisma](https://www.prisma.io/) - 下一代ORM
- [tRPC](https://trpc.io/) - 端到端类型安全
- [DeepSeek](https://www.deepseek.com/) - AI服务
- [Prometheus](https://prometheus.io/) - 监控系统
- [Grafana](https://grafana.com/) - 可视化平台

---

## 🌟 Star History

如果这个项目对你有帮助，请给个⭐️Star！

---

**版本：** V2.0  
**更新日期：** 2025-10-14  
**团队：** AI Quiz Development Team

---

**💡 提示：** 所有详细文档都在 [`docs/`](./docs/) 目录下，根据你的角色选择对应的文档。

