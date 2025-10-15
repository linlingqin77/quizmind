import { z } from 'zod';

/**
 * 查询考试列表 Schema
 */
export const listExamsSchema = z.object({
  page: z.number()
    .int('页码必须是整数')
    .min(1, '页码最小为1')
    .default(1),
  
  limit: z.number()
    .int('每页数量必须是整数')
    .min(1, '每页最少1条')
    .max(100, '每页最多100条')
    .default(10),
  
  status: z.enum(['DRAFT', 'PUBLISHED', 'ENDED'])
    .optional(),
  
  search: z.string()
    .max(50, '搜索关键词最多50个字符')
    .optional(),
});

export type ListExamsInput = z.infer<typeof listExamsSchema>;

