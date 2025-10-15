import { z } from 'zod';

/**
 * 用户注册 Schema
 */
export const registerSchema = z.object({
  email: z.string()
    .email('邮箱格式不正确')
    .toLowerCase()
    .trim(),
  
  username: z.string()
    .min(4, '用户名至少4个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
    .trim(),
  
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(50, '密码最多50个字符'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

