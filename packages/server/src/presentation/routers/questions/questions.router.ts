import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../../core/trpc/trpc';
import { firstValueFrom } from 'rxjs';

// Zod 验证 Schema
const createQuestionSchema = z.object({
  type: z.enum(['SINGLE', 'MULTIPLE', 'JUDGE', 'FILL', 'ESSAY']),
  content: z.string().min(1, '题目内容不能为空'),
  options: z.record(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  categoryId: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  score: z.number().int().positive(),
});

const updateQuestionSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  options: z.record(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  score: z.number().int().positive().optional(),
});

const listQuestionsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  type: z.string().optional(),
  categoryId: z.string().optional(),
  difficulty: z.string().optional(),
});

// gRPC 服务接口
interface QuestionService {
  create(data: any): any;
  findById(data: any): any;
  list(data: any): any;
  update(data: any): any;
  delete(data: any): any;
  findByCategory(data: any): any;
  findByDifficulty(data: any): any;
}

/**
 * 题目路由 - API Gateway
 */
@Injectable()
export class QuestionsRouter implements OnModuleInit {
  private questionService: QuestionService;

  constructor(
    @Inject('QUESTION_SERVICE') private grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.questionService = this.grpcClient.getService<QuestionService>('QuestionService');
  }

  router = router({
    // 创建题目（管理员）
    create: adminProcedure
      .input(createQuestionSchema)
      .mutation(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.create({
            type: input.type,
            content: input.content,
            options: JSON.stringify(input.options || {}),
            correctAnswer: input.correctAnswer,
            explanation: input.explanation || '',
            categoryId: input.categoryId || '',
            difficulty: input.difficulty,
            score: input.score,
          })
        );
        
        return {
          ...result,
          options: JSON.parse(result.options || '{}'),
        };
      }),

    // 获取题目详情
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.findById({ id: input.id })
        );
        
        return {
          ...result,
          options: JSON.parse(result.options || '{}'),
        };
      }),

    // 获取题目列表
    list: protectedProcedure
      .input(listQuestionsSchema)
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.list({
            page: input.page,
            limit: input.limit,
            type: input.type || '',
            categoryId: input.categoryId || '',
            difficulty: input.difficulty || '',
          })
        );
        
        return {
          questions: result.questions.map((q: any) => ({
            ...q,
            options: JSON.parse(q.options || '{}'),
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            pages: Math.ceil(result.total / result.limit),
          },
        };
      }),

    // 更新题目（管理员）
    update: adminProcedure
      .input(updateQuestionSchema)
      .mutation(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.update({
            id: input.id,
            content: input.content || '',
            options: JSON.stringify(input.options || {}),
            correctAnswer: input.correctAnswer || '',
            explanation: input.explanation || '',
            difficulty: input.difficulty || '',
            score: input.score || 0,
          })
        );
        
        return {
          ...result,
          options: JSON.parse(result.options || '{}'),
        };
      }),

    // 删除题目（管理员）
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.delete({ id: input.id })
        );
        
        return result;
      }),

    // 按分类查询
    getByCategory: protectedProcedure
      .input(z.object({
        categoryId: z.string(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
      }))
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.findByCategory({
            categoryId: input.categoryId,
            page: input.page,
            limit: input.limit,
          })
        );
        
        return {
          questions: result.questions.map((q: any) => ({
            ...q,
            options: JSON.parse(q.options || '{}'),
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            pages: Math.ceil(result.total / result.limit),
          },
        };
      }),

    // 按难度查询
    getByDifficulty: protectedProcedure
      .input(z.object({
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
      }))
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.questionService.findByDifficulty({
            difficulty: input.difficulty,
            page: input.page,
            limit: input.limit,
          })
        );
        
        return {
          questions: result.questions.map((q: any) => ({
            ...q,
            options: JSON.parse(q.options || '{}'),
          })),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            pages: Math.ceil(result.total / result.limit),
          },
        };
      }),
  });
}

