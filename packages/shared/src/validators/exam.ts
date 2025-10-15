import { z } from 'zod';

export const examStatusSchema = z.enum(['draft', 'published', 'archived']);

export const examQuestionSchema = z.object({
  questionId: z.string(),
  score: z.number().positive(),
  order: z.number().int().nonnegative(),
});

export const createExamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  duration: z.number().positive(),
  totalScore: z.number().positive().default(100),
  passScore: z.number().positive().default(60),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  questions: z.array(examQuestionSchema).optional(),
});

export const updateExamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  duration: z.number().positive().optional(),
  totalScore: z.number().positive().optional(),
  passScore: z.number().positive().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  status: examStatusSchema.optional(),
});

export const submitExamSchema = z.object({
  examId: z.string(),
  answers: z.record(z.any()),
  duration: z.number().int().nonnegative(),
});
