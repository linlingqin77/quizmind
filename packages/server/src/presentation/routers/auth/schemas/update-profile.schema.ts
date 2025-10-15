import { z } from 'zod';

/**
 * 更新个人信息 Schema
 */
export const updateProfileSchema = z.object({
  nickname: z.string()
    .max(50, '昵称最多50个字符')
    .optional(),
  
  avatar: z.string()
    .url('头像必须是有效的URL')
    .optional(),
  
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
    .optional(),
  
  bio: z.string()
    .max(200, '个人简介最多200个字符')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

