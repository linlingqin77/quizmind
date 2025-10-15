import { z } from 'zod';

/**
 * 用户登录 Schema
 */
export const loginSchema = z.object({
  identifier: z.string()
    .min(1, '请输入用户名或邮箱')
    .trim(),
  
  password: z.string()
    .min(1, '请输入密码'),
});

export type LoginInput = z.infer<typeof loginSchema>;

