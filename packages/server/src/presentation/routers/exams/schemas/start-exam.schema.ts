import { z } from 'zod';

/**
 * 开始考试 Schema
 */
export const startExamSchema = z.object({
  examId: z.string().min(1, '考试ID不能为空'),
});

export type StartExamInput = z.infer<typeof startExamSchema>;

