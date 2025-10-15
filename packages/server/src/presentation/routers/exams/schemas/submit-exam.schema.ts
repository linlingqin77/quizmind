import { z } from 'zod';

/**
 * 提交考试 Schema
 */
export const submitExamSchema = z.object({
  recordId: z.string().min(1, '考试记录ID不能为空'),
  
  answers: z.record(z.any(), {
    description: '答案对象，key为题目ID，value为答案',
  }),
});

export type SubmitExamInput = z.infer<typeof submitExamSchema>;

