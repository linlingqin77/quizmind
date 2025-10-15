# Zod Schema 组织规范

## 📁 目录结构

每个 Router 模块都有自己的 schemas 子目录：

```
presentation/routers/
├── auth/
│   ├── schemas/                    # ← Auth Schema 目录
│   │   ├── register.schema.ts
│   │   ├── login.schema.ts
│   │   ├── update-profile.schema.ts
│   │   ├── change-password.schema.ts
│   │   └── index.ts               # 统一导出
│   └── auth.router.ts
│
├── exams/
│   ├── schemas/
│   │   ├── create-exam.schema.ts
│   │   ├── update-exam.schema.ts
│   │   ├── list-exams.schema.ts
│   │   ├── start-exam.schema.ts
│   │   ├── submit-exam.schema.ts
│   │   └── index.ts
│   └── exams.router.ts
│
├── questions/
│   ├── schemas/
│   │   ├── create-question.schema.ts
│   │   ├── update-question.schema.ts
│   │   ├── list-questions.schema.ts
│   │   └── index.ts
│   └── questions.router.ts
│
└── users/
    ├── schemas/                   # 可选
    └── users.router.ts
```

---

## 📝 Schema 文件命名规范

### 1. 操作类型 + 模块名

```typescript
// ✅ 好的命名
create-exam.schema.ts          // 创建考试
update-user.schema.ts          // 更新用户
list-questions.schema.ts       // 查询题目列表
delete-category.schema.ts      // 删除分类

// ❌ 不好的命名
exam-create.schema.ts          // 顺序错误
examSchema.ts                  // 不够具体
createExamInput.ts             // 不是 schema 文件
```

### 2. 特殊操作命名

```typescript
login.schema.ts                // 登录
register.schema.ts             // 注册
change-password.schema.ts      // 修改密码
reset-password.schema.ts       // 重置密码
verify-email.schema.ts         // 验证邮箱
```

---

## 🔧 Schema 文件模板

### 标准 Schema 文件

```typescript
import { z } from 'zod';

/**
 * [操作描述] Schema
 * 
 * @example
 * {
 *   field1: 'value',
 *   field2: 123,
 * }
 */
export const operationNameSchema = z.object({
  // 字段定义
  field1: z.string()
    .min(1, '错误提示')
    .max(100, '错误提示'),
  
  field2: z.number()
    .int()
    .positive(),
});

/**
 * 导出推导的 TypeScript 类型
 */
export type OperationNameInput = z.infer<typeof operationNameSchema>;
```

### 带验证逻辑的 Schema

```typescript
import { z } from 'zod';

/**
 * 修改密码 Schema
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string(),
})
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: '两次密码输入不一致',
      path: ['confirmPassword'],
    }
  )
  .refine(
    (data) => data.oldPassword !== data.newPassword,
    {
      message: '新密码不能与旧密码相同',
      path: ['newPassword'],
    }
  );

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

---

## 📋 index.ts 导出规范

```typescript
/**
 * [模块名] 相关的所有 Zod Schema
 * 统一导出，方便导入使用
 */

// 导出所有 Schema
export * from './create-xxx.schema';
export * from './update-xxx.schema';
export * from './list-xxx.schema';
export * from './delete-xxx.schema';

// 也可以显式导出（更清晰）
export { createXxxSchema, type CreateXxxInput } from './create-xxx.schema';
export { updateXxxSchema, type UpdateXxxInput } from './update-xxx.schema';
```

---

## 🎯 Router 中使用 Schema

### 导入方式

```typescript
// ✅ 推荐：统一从 schemas 目录导入
import {
  createExamSchema,
  updateExamSchema,
  listExamsSchema,
} from './schemas';

// ❌ 不推荐：单独导入每个文件
import { createExamSchema } from './schemas/create-exam.schema';
import { updateExamSchema } from './schemas/update-exam.schema';
```

### 使用示例

```typescript
@Injectable()
export class ExamsRouter {
  router = router({
    create: protectedProcedure
      .input(createExamSchema)  // ← 使用 Schema
      .mutation(async ({ input }) => {
        // input 类型自动推导
        return this.examsService.create(input);
      }),
    
    update: protectedProcedure
      .input(updateExamSchema)
      .mutation(async ({ input }) => {
        return this.examsService.update(input.id, input);
      }),
  });
}
```

---

## 🔍 Schema 复用

### 基础 Schema

```typescript
// schemas/base/user.schema.ts
export const baseUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
});

// schemas/create-user.schema.ts
import { baseUserSchema } from './base/user.schema';

export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6),
});

// schemas/update-user.schema.ts
export const updateUserSchema = baseUserSchema.partial().extend({
  id: z.string(),
});
```

### 共享验证规则

```typescript
// schemas/common/validators.ts
export const emailValidator = z.string()
  .email('邮箱格式不正确')
  .toLowerCase()
  .trim();

export const passwordValidator = z.string()
  .min(6, '密码至少6个字符')
  .max(50, '密码最多50个字符');

export const phoneValidator = z.string()
  .regex(/^1[3-9]\d{9}$/, '手机号格式不正确');

// schemas/register.schema.ts
import { emailValidator, passwordValidator } from './common/validators';

export const registerSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  username: z.string().min(3),
});
```

---

## ✅ 最佳实践

### 1. 一个操作一个 Schema 文件

```typescript
// ✅ 好
create-exam.schema.ts    // 创建考试的 Schema
update-exam.schema.ts    // 更新考试的 Schema

// ❌ 不好
exam.schema.ts          // 所有考试相关 Schema 都在一个文件
```

### 2. 使用有意义的错误消息

```typescript
// ✅ 好
z.string().min(1, '标题不能为空')
z.number().positive('分数必须大于0')

// ❌ 不好
z.string().min(1)
z.number().positive()
```

### 3. 导出 TypeScript 类型

```typescript
// ✅ 始终导出类型
export const createExamSchema = z.object({ ... });
export type CreateExamInput = z.infer<typeof createExamSchema>;

// ❌ 不导出类型（Service 层无法使用）
export const createExamSchema = z.object({ ... });
```

### 4. 适当使用默认值

```typescript
// ✅ 为可选参数提供默认值
z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.string().optional(),
})

// ❌ 所有字段都设默认值（可能隐藏错误）
z.object({
  title: z.string().default('未命名'),  // ❌
})
```

---

## 📚 常用 Schema 示例

### 分页查询

```typescript
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### ID 参数

```typescript
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
});
```

### 时间范围

```typescript
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: '开始时间不能晚于结束时间' }
  );
```

---

## 🎉 总结

### 优势：

✅ **清晰的组织** - 每个模块的 Schema 独立管理  
✅ **易于维护** - 修改 Schema 不影响 Router  
✅ **类型安全** - 导出类型供 Service 层使用  
✅ **便于复用** - Schema 可以组合和继承  
✅ **统一导入** - 通过 index.ts 简化导入

### 记住：

1. Schema 文件放在 `schemas/` 子目录
2. 一个操作一个 Schema 文件
3. 通过 `index.ts` 统一导出
4. Router 从 `./schemas` 导入
5. 始终导出 TypeScript 类型

