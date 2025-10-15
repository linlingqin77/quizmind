# Shared - 共享代码库

包含前后端共享的类型定义、工具函数、验证器和常量。

## 目录结构

```
src/
├── types/           # TypeScript 类型定义
│   ├── user.ts
│   ├── question.ts
│   ├── exam.ts
│   └── common.ts
├── validators/      # Zod 验证器
│   ├── user.ts
│   ├── question.ts
│   └── exam.ts
├── utils/          # 工具函数
│   ├── date.ts
│   ├── string.ts
│   └── validation.ts
├── constants/      # 常量定义
│   ├── roles.ts
│   ├── question-types.ts
│   └── exam-status.ts
└── index.ts        # 导出入口
```

## 使用方式

### 在前端项目中使用

```typescript
import { User, ROLES, formatDate } from 'shared';

const user: User = {
  id: '1',
  username: 'student',
  email: 'student@example.com',
  role: ROLES.STUDENT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log(formatDate(user.createdAt));
```

### 在后端项目中使用

```typescript
import { createUserSchema, ROLE_PERMISSIONS } from 'shared';

// 使用 Zod 验证
const result = createUserSchema.parse(userData);

// 检查权限
const permissions = ROLE_PERMISSIONS.teacher;
```

## 主要内容

### 类型定义（Types）

- **User**: 用户相关类型
- **Question**: 题目相关类型
- **Exam**: 考试相关类型
- **Common**: 通用类型（分页、API响应等）

### 验证器（Validators）

使用 Zod 定义的验证模式，用于数据验证。

### 工具函数（Utils）

- **date**: 日期处理函数
- **string**: 字符串处理函数
- **validation**: 验证函数

### 常量（Constants）

- **roles**: 角色定义和权限
- **question-types**: 题目类型
- **exam-status**: 考试状态

## 添加新内容

1. 在对应目录下创建文件
2. 在 `index.ts` 中导出
3. 确保前后端都能正常引用
