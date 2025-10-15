import { z } from 'zod';

/**
 * 更新考试 Schema
 */
export const updateExamSchema = z.object({
  id: z.string().min(1, '考试ID不能为空'),
  
  title: z.string()
    .min(1, '标题不能为空')
    .max(100, '标题最多100个字符')
    .optional(),
  
  description: z.string()
    .max(500, '描述最多500个字符')
    .optional(),
  
  duration: z.number()
    .int('考试时长必须是整数')
    .positive('考试时长必须大于0')
    .max(300, '考试时长最多300分钟')
    .optional(),
  
  status: z.enum(['DRAFT', 'PUBLISHED', 'ENDED'], {
    errorMap: () => ({ message: '状态值不正确' }),
  }).optional(),
});

export type UpdateExamInput = z.infer<typeof updateExamSchema>;

