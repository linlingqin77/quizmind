import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../../../core/trpc/trpc';
import { firstValueFrom } from 'rxjs';

// ✅ 导入所有 Schema（干净整洁）
import {
  createExamSchema,
  updateExamSchema,
  listExamsSchema,
  startExamSchema,
  submitExamSchema,
} from './schemas';

// gRPC 服务接口定义
interface ExamService {
  create(data: any): any;
  findById(data: any): any;
  list(data: any): any;
  update(data: any): any;
  delete(data: any): any;
  start(data: any): any;
  submit(data: any): any;
}

/**
 * 考试路由 - API Gateway
 * 职责：
 * 1. 接收前端 tRPC 请求
 * 2. 调用后端 gRPC 微服务
 * 3. 转换响应返回给前端
 */
@Injectable()
export class ExamsRouter implements OnModuleInit {
  private examService: ExamService;

  constructor(
    @Inject('EXAM_SERVICE') private grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    // 获取 gRPC 服务实例
    this.examService = this.grpcClient.getService<ExamService>('ExamService');
  }

  router = router({
    // 创建考试
    create: protectedProcedure
      .input(createExamSchema)
      .mutation(async ({ input, ctx }) => {
        // 调用 gRPC 微服务
        const result = await firstValueFrom(
          this.examService.create({
            title: input.title,
            description: input.description || '',
            duration: input.duration,
            totalScore: input.totalScore,
            paperId: input.paperId || '',
            startTime: input.startTime || '',
            endTime: input.endTime || '',
          })
        );
        
        return result;
      }),

    // 获取考试详情
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.examService.findById({ id: input.id })
        );
        
        return result;
      }),

    // 获取考试列表
    list: protectedProcedure
      .input(listExamsSchema)
      .query(async ({ input }) => {
        const result = await firstValueFrom(
          this.examService.list({
            page: input.page,
            limit: input.limit,
            status: input.status || '',
          })
        );
        
        return {
          exams: result.exams,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            pages: Math.ceil(result.total / result.limit),
          },
        };
      }),

    // 更新考试
    update: protectedProcedure
      .input(updateExamSchema)
      .mutation(async ({ input }) => {
        const result = await firstValueFrom(
          this.examService.update({
            id: input.id,
            title: input.title || '',
            description: input.description || '',
            duration: input.duration || 0,
            status: input.status || '',
          })
        );
        
        return result;
      }),

    // 删除考试（管理员）
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const result = await firstValueFrom(
          this.examService.delete({ id: input.id })
        );
        
        return result;
      }),

    // 开始考试
    start: protectedProcedure
      .input(startExamSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await firstValueFrom(
          this.examService.start({
            examId: input.examId,
            userId: ctx.user.id,
          })
        );
        
        return result;
      }),

    // 提交考试
    submit: protectedProcedure
      .input(submitExamSchema)
      .mutation(async ({ input }) => {
        const result = await firstValueFrom(
          this.examService.submit({
            recordId: input.recordId,
            answers: JSON.stringify(input.answers),
          })
        );
        
        return result;
      }),
  });
}

