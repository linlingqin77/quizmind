# 📝 更新日志

本文档记录 QuizMind 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2025-10-16

### 🎉 重大变更

#### 移动端架构重构
- **迁移至 Expo 架构** - 从 React Native CLI 迁移到 Expo，简化开发流程
- **Expo Router** - 采用文件系统路由，替代 React Navigation
- **类型安全 API** - 集成 tRPC + React Query，端到端类型安全
- **安全存储** - 使用 Expo Secure Store 加密存储敏感数据

### ✨ 新增功能

#### 移动端
- 新增 Expo Router 文件系统路由
- 新增认证系统（登录/注册）
- 新增认证守卫（自动重定向）
- 新增 Tab 导航（首页/练习/考试/个人中心）
- 新增 Redux Toolkit 状态管理
- 新增 React Query 服务端状态缓存
- 新增 tRPC 客户端集成
- 新增 useAuth Hook
- 新增路径别名配置
- 新增主题系统
- 新增通用组件（Button）

#### 文档
- 新增移动端完整开发指南
- 新增移动端快速开始文档
- 新增移动端迁移指南
- 新增移动端重构总结
- 新增文档中心索引

### 🔄 变更

#### 技术栈升级
- React: 18.2 → 19.1.0
- TypeScript: 5.3 → 5.9.2
- Redux Toolkit: 1.9.7 → 2.5.0
- React Query: 无 → 5.90.3
- tRPC: 无 → 10.45.2

#### 项目结构
```diff
packages/mobile/
- ├── android/          # Android 原生代码
- ├── ios/              # iOS 原生代码
- ├── src/
- │   ├── screens/
- │   └── navigation/   # React Navigation
+ ├── app/              # Expo Router 路由
+ │   ├── (tabs)/      # Tab 导航
+ │   ├── auth/        # 认证页面
+ │   ├── _layout.tsx  # 根布局
+ │   └── index.tsx    # 入口
+ ├── src/
+ │   ├── services/    # tRPC 客户端
+ │   └── store/       # Redux Store
```

### 🗑️ 移除

- 移除 React Navigation 配置
- 移除 Android/iOS 原生配置（由 Expo 管理）
- 移除 metro.config.js 自定义配置
- 移除 babel.config.js 部分配置

### 🐛 修复

- 修复路径别名在 TypeScript 中不生效的问题
- 修复认证状态持久化问题
- 修复 Redux DevTools 配置

### 📚 文档

- 更新 README.md，添加移动端 Expo 架构说明
- 更新项目结构说明
- 更新技术栈列表
- 更新快速开始指南
- 新增移动端文档导航

### 🔧 配置

- 添加 Expo 配置（app.json, app.config.js）
- 添加 Babel 路径别名配置
- 添加 Metro 配置
- 添加 ESLint + Prettier 配置
- 添加 Jest 测试配置

---

## [0.9.0] - 2025-10-15

### ✨ 新增功能

#### 服务端
- 完成 NestJS 微服务架构
- 完成 9 个微服务（User, Exam, Question, Paper, AI, Practice, Analytics, Social, Document）
- 完成 tRPC API Gateway
- 完成 RBAC 权限系统
- 完成审计日志系统
- 完成监控告警系统（Prometheus + Grafana + Jaeger）

#### 文档
- 完成服务端完整开发指南
- 完成架构设计文档
- 完成监控系统指南
- 完成产品需求文档

---

## [0.8.0] - 2025-10-14

### ✨ 新增功能

- 完成数据库 Schema 设计（Prisma）
- 完成 gRPC 服务定义（Protocol Buffers）
- 完成企业级功能（邮件、上传、队列）
- 完成健康检查和指标监控

---

## [0.7.0] - 2025-10-13

### ✨ 新增功能

- 初始化 Monorepo 项目结构
- 配置 pnpm workspace
- 初始化移动端项目（React Native CLI）
- 初始化服务端项目（NestJS）
- 初始化共享类型库

---

## 版本规范

### 版本号格式
主版本号.次版本号.修订号（Major.Minor.Patch）

### 版本更新规则
- **主版本号（Major）**: 不兼容的 API 变更
- **次版本号（Minor）**: 向下兼容的功能新增
- **修订号（Patch）**: 向下兼容的问题修复

### 变更类型
- `Added` - 新增功能
- `Changed` - 功能变更
- `Deprecated` - 即将废弃的功能
- `Removed` - 移除的功能
- `Fixed` - Bug 修复
- `Security` - 安全性修复

---

## 计划中的功能

### v1.1.0 (计划中)
- [ ] 移动端练习功能完整实现
- [ ] 移动端考试功能完整实现
- [ ] 移动端错题本功能
- [ ] 移动端学习报告
- [ ] 移动端社交功能

### v1.2.0 (计划中)
- [ ] Web 管理后台（教师端）
- [ ] 题库管理功能
- [ ] 智能组卷功能
- [ ] 考试监控功能

### v2.0.0 (规划中)
- [ ] AI 智能批改
- [ ] AI 智能出题
- [ ] AI 学习路径推荐
- [ ] OCR 试卷识别

---

## 贡献指南

### 提交变更
1. 在相应版本号下添加变更
2. 使用正确的变更类型标签
3. 描述要简洁清晰
4. 链接相关的 Issue 或 PR

### 示例
```markdown
### ✨ 新增功能
- 新增用户注册功能 (#123)
- 新增邮箱验证 (#124)

### 🐛 修复
- 修复登录页面崩溃问题 (#125)
```

---

<div align="center">

**保持更新日志的更新，让团队了解项目进展**

Last Updated: 2025-10-16

</div>

