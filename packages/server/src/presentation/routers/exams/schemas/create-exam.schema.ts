import { z } from 'zod';

/**
 * 创建考试 Schema
 */
export const createExamSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(100, '标题最多100个字符'),
  
  description: z.string()
    .max(500, '描述最多500个字符')
    .optional(),
  
  duration: z.number()
    .int('考试时长必须是整数')
    .positive('考试时长必须大于0')
    .max(300, '考试时长最多300分钟'),
  
  totalScore: z.number()
    .positive('总分必须大于0')
    .max(1000, '总分最多1000分'),
  
  paperId: z.string().optional(),
  
  startTime: z.string()
    .datetime('开始时间格式不正确')
    .optional(),
  
  endTime: z.string()
    .datetime('结束时间格式不正确')
    .optional(),
});

/**
 * 导出推导的类型
 */
export type CreateExamInput = z.infer<typeof createExamSchema>;

