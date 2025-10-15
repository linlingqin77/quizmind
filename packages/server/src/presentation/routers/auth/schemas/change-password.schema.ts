import { z } from 'zod';

/**
 * 修改密码 Schema
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string()
    .min(1, '请输入旧密码'),
  
  newPassword: z.string()
    .min(6, '新密码至少6个字符')
    .max(50, '新密码最多50个字符'),
})
  .refine(
    (data) => data.oldPassword !== data.newPassword,
    {
      message: '新密码不能与旧密码相同',
      path: ['newPassword'],
    }
  );

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

