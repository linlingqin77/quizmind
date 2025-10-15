import { z } from 'zod';

export const questionTypeSchema = z.enum([
  'single_choice',
  'multiple_choice',
  'true_false',
  'short_answer',
  'essay',
]);

export const questionOptionSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const createQuestionSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  type: questionTypeSchema,
  options: z.array(questionOptionSchema).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(1),
  tags: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});
