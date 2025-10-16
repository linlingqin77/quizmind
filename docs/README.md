# 📚 QuizMind 文档中心

欢迎来到 QuizMind AI 智能题库系统的文档中心。这里包含了完整的项目文档，涵盖移动端、服务端、架构设计、产品需求等各个方面。

---

## 📱 移动端文档（Expo）

### 核心文档
| 文档 | 描述 | 适合人群 |
|------|------|---------|
| [📱 移动端完整开发指南](./移动端完整开发指南.md) | Expo + Expo Router 完整开发手册，包含技术栈、核心功能、最佳实践 | 移动端开发者 |
| [🚀 移动端快速开始](./移动端快速开始.md) | 快速启动指南，从安装到运行，5分钟上手 | 新手开发者 |
| [🔄 移动端迁移指南](./移动端迁移指南.md) | React Native CLI 到 Expo 的完整迁移过程 | 架构师 |
| [📊 移动端重构总结](./移动端重构总结.md) | 重构的技术决策、成果和经验总结 | 技术负责人 |

### 技术栈（移动端）
- **框架**: Expo ~54.0.0
- **路由**: Expo Router ~4.0.0 (文件系统路由)
- **状态**: Redux Toolkit 2.5.0 + React Query 5.90.3
- **API**: tRPC Client 10.45.2 (端到端类型安全)
- **存储**: Expo Secure Store + AsyncStorage
- **语言**: TypeScript 5.9.2

---

## 🚀 服务端文档

### 核心文档
| 文档 | 描述 | 适合人群 |
|------|------|---------|
| [🚀 服务端完整开发指南](./服务端完整开发指南.md) | NestJS 微服务架构完整手册 | 后端开发者 |
| [🏗️ 架构设计文档](./服务端文档/ARCHITECTURE.md) | 系统架构、技术选型、设计模式 | 架构师 |
| [📊 监控系统指南](./服务端文档/MONITORING_GUIDE.md) | Prometheus + Grafana + Jaeger 监控体系 | 运维工程师 |
| [📐 Schema 设计指南](./服务端文档/SCHEMAS_GUIDE.md) | Prisma Schema 设计和最佳实践 | 数据库开发者 |
| [📈 架构图集](./服务端文档/ARCHITECTURE_DIAGRAMS.md) | 完整的系统架构图和时序图 | 所有开发者 |
| [✅ 已完成功能](./服务端文档/COMPONENTS_COMPLETED.md) | 已实现的功能模块清单 | 项目经理 |
| [🔬 微服务指南](./服务端文档/MICROSERVICES.md) | gRPC 微服务架构详解 | 后端开发者 |

### 技术栈（服务端）
- **框架**: NestJS 10.0
- **数据库**: PostgreSQL 16 + Prisma ORM 5.8
- **微服务**: gRPC 1.60 + Protocol Buffers
- **API**: tRPC 10.45 + REST
- **缓存**: Redis 7.2
- **监控**: Prometheus + Grafana + Jaeger
- **AI**: DeepSeek + Pinecone
- **语言**: TypeScript 5.3.3

---

## 📋 产品与需求文档

### 核心文档
| 文档 | 描述 | 适合人群 |
|------|------|---------|
| [📋 产品需求文档(PRD)](./产品需求文档/产品需求文档(PRD).md) | 完整的产品功能需求和业务流程 | 产品经理 |
| [🔍 竞品分析](./产品需求文档/竞品分析与功能补充建议.md) | 市场竞品分析和功能建议 | 产品经理 |
| [📝 需求总结](./产品需求文档/项目需求总结.md) | 项目需求的整体总结 | 所有人员 |
| [🎯 项目管理与排期](./项目管理与排期.md) | 开发计划、里程碑、时间表 | 项目经理 |

---

## 🏁 快速开始

### 移动端
```bash
# 1. 安装依赖
pnpm install

# 2. 启动 Expo 开发服务器
cd packages/mobile
pnpm start

# 3. 选择平台
# 按 'i' → iOS 模拟器
# 按 'a' → Android 模拟器
# 按 'w' → Web 浏览器
# 扫码 → 真机 (Expo Go)
```

### 服务端
```bash
# 1. 配置环境变量
cd packages/server
cp .env.example .env

# 2. 初始化数据库
npx prisma generate
npx prisma db push
npx prisma db seed

# 3. 启动服务
pnpm run start:dev
```

---

## 📐 项目架构

### 技术架构
```
┌─────────────────────────────────────────────────┐
│          客户端层 (Expo + React 19)            │
│  iOS App │ Android App │ Web (Preview)          │
└────────────────┬────────────────────────────────┘
                 │
                 │ tRPC (类型安全 API)
                 ↓
┌─────────────────────────────────────────────────┐
│      API 网关 (NestJS + tRPC + REST)           │
│       HTTP/3000 + WebSocket                     │
└────────────────┬────────────────────────────────┘
                 │
                 │ gRPC (高性能 RPC)
                 ↓
┌─────────────────────────────────────────────────┐
│              微服务层 (9个服务)                 │
│  User│Exam│Question│Paper│AI│Practice│          │
│  Analytics│Social│Document                      │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         数据层 + 基础设施                       │
│  PostgreSQL│Redis│Pinecone│Consul│              │
│  Prometheus│Grafana│Jaeger│ELK                  │
└─────────────────────────────────────────────────┘
```

### Monorepo 结构
```
quizmind/
├── packages/
│   ├── mobile/       # 📱 Expo 移动端
│   ├── server/       # 🚀 NestJS 服务端
│   └── shared/       # 📦 共享类型库
├── docs/            # 📚 项目文档（本目录）
└── pnpm-workspace.yaml
```

---

## 🎯 核心功能

### 学员端（移动端）
- ✅ **6 种练习模式** - 顺序、随机、专项、题型、错题、章节
- ✅ **背题模式** - 卡片式翻页、自动播放、掌握度标记
- ✅ **在线考试** - 实时监考、防作弊、自动计时
- ✅ **错题本** - 智能复习、订正记录、掌握度追踪
- ✅ **学习分析** - 学习时长、正确率、能力雷达图
- ✅ **社交功能** - 排行榜、好友 PK、题目讨论

### 教师端（Web）
- ✅ **题库管理** - 5 种题型、多级分类、批量操作
- ✅ **智能组卷** - AI 辅助、难度平衡、知识点覆盖
- ✅ **考试监控** - 实时状态、异常检测、成绩统计
- ✅ **学员管理** - 成绩分析、学习报告、个性化建议

---

## 🛠️ 开发规范

### Git 提交规范
```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
build: 构建
ci: CI/CD
chore: 其他
```

### 代码规范
- ✅ 使用 ESLint + Prettier
- ✅ TypeScript 严格模式
- ✅ 单元测试覆盖率 >= 80%
- ✅ 遵循阿里开发规范

---

## 📊 文档更新记录

| 日期 | 变更 | 负责人 |
|------|------|--------|
| 2025-10-16 | 移动端迁移至 Expo 架构，新增 4 个移动端文档 | Development Team |
| 2025-10-15 | 完成服务端微服务架构文档 | Backend Team |
| 2025-10-14 | 添加监控系统指南和架构图集 | DevOps Team |
| 2025-10-13 | 创建产品需求文档和项目排期 | Product Team |

---

## 💡 文档阅读指南

### 按角色选择
- **移动端开发者** → 移动端完整开发指南 + 快速开始
- **后端开发者** → 服务端完整开发指南 + 架构设计
- **全栈开发者** → 移动端 + 服务端完整指南
- **架构师** → 架构设计文档 + 迁移指南
- **运维工程师** → 监控系统指南 + 微服务指南
- **产品经理** → 产品需求文档 + 项目排期
- **新人** → 快速开始 + README

### 按学习路径
1. **入门** → README.md → 快速开始
2. **深入** → 完整开发指南 → 架构文档
3. **实战** → 最佳实践 → 代码示例
4. **进阶** → 微服务 → 监控 → 优化

---

## 🔗 相关链接

### 外部文档
- [Expo 官方文档](https://docs.expo.dev/)
- [Expo Router 文档](https://expo.github.io/router/)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [tRPC 官方文档](https://trpc.io/)
- [React Query 文档](https://tanstack.com/query/)

### 内部资源
- [GitHub 仓库](https://github.com/linlingqin77/quizmind)
- [API 文档](http://localhost:3000/api) (本地开发)
- [Grafana 监控](http://localhost:3001) (本地监控)

---

## 📞 获取帮助

- 📧 **Email**: linlingqin77@qq.com
- 💬 **Discussions**: [GitHub Discussions](https://github.com/linlingqin77/quizmind/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/linlingqin77/quizmind/issues)

---

## 🙏 贡献文档

欢迎贡献文档！如果你发现：
- 文档错误或不清晰
- 缺少某个主题的文档
- 有更好的表达方式

请提交 Pull Request 或创建 Issue。

---

<div align="center">

**📚 保持文档更新，让开发更简单**

Made with ❤️ by QuizMind Team  
Last Updated: 2025-10-16

</div>
