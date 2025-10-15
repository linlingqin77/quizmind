import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

export interface JobData {
  type: string;
  payload: any;
  priority?: number;
  delay?: number; // 延迟执行时间（毫秒）
  maxAttempts?: number;
}

export interface JobProcessor {
  process(data: any): Promise<void>;
}

/**
 * 消息队列服务
 * 处理异步任务，如邮件发送、数据处理等
 */
@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private processors: Map<string, JobProcessor> = new Map();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async onModuleInit() {
    // 注册内置处理器
    this.registerBuiltinProcessors();
    
    // 启动队列处理
    this.startProcessing();
  }

  /**
   * 添加任务到队列
   */
  async addJob(name: string, data: JobData): Promise<string> {
    const job = await this.prisma.jobQueue.create({
      data: {
        name,
        data: data.payload,
        priority: data.priority || 0,
        maxAttempts: data.maxAttempts || 3,
        status: data.delay ? 'DELAYED' : 'WAITING',
        createdAt: data.delay ? new Date(Date.now() + data.delay) : new Date(),
      },
    });

    this.logger.log(`任务已添加到队列: ${name} (${job.id})`);
    return job.id;
  }

  /**
   * 注册任务处理器
   */
  registerProcessor(name: string, processor: JobProcessor): void {
    this.processors.set(name, processor);
    this.logger.log(`任务处理器已注册: ${name}`);
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats() {
    const [statusStats, nameStats, totalJobs] = await Promise.all([
      this.prisma.jobQueue.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      this.prisma.jobQueue.groupBy({
        by: ['name'],
        _count: {
          name: true,
        },
      }),
      this.prisma.jobQueue.count(),
    ]);

    return {
      total: totalJobs,
      statusStats: statusStats.map((stat) => ({
        status: stat.status,
        count: stat._count.status,
      })),
      nameStats: nameStats.map((stat) => ({
        name: stat.name,
        count: stat._count.name,
      })),
    };
  }

  /**
   * 获取失败的任务
   */
  async getFailedJobs(page = 1, limit = 20) {
    const [jobs, total] = await Promise.all([
      this.prisma.jobQueue.findMany({
        where: { status: 'FAILED' },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobQueue.count({
        where: { status: 'FAILED' },
      }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 重试失败的任务
   */
  async retryJob(jobId: string): Promise<void> {
    await this.prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'WAITING',
        attempts: 0,
        error: null,
        processedAt: null,
      },
    });

    this.logger.log(`任务已重新排队: ${jobId}`);
  }

  /**
   * 清理已完成的任务
   */
  async cleanupCompletedJobs(days = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.jobQueue.deleteMany({
      where: {
        status: 'COMPLETED',
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`清理了 ${result.count} 个已完成的任务`);
    return result.count;
  }

  /**
   * 暂停队列处理
   */
  pauseProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.logger.log('队列处理已暂停');
  }

  /**
   * 恢复队列处理
   */
  resumeProcessing(): void {
    if (!this.processingInterval) {
      this.startProcessing();
    }
    this.logger.log('队列处理已恢复');
  }

  private startProcessing(): void {
    const interval = this.configService.get('QUEUE_PROCESS_INTERVAL', 5000);
    
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processJobs();
      }
    }, interval);

    this.logger.log('队列处理已启动');
  }

  private async processJobs(): Promise<void> {
    this.isProcessing = true;

    try {
      // 获取待处理的任务
      const jobs = await this.prisma.jobQueue.findMany({
        where: {
          OR: [
            { status: 'WAITING' },
            {
              status: 'DELAYED',
              createdAt: {
                lte: new Date(),
              },
            },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: 10, // 每次处理最多10个任务
      });

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      this.logger.error(`队列处理出错: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: any): Promise<void> {
    const processor = this.processors.get(job.name);
    
    if (!processor) {
      this.logger.warn(`未找到任务处理器: ${job.name}`);
      await this.markJobFailed(job.id, '未找到任务处理器');
      return;
    }

    // 标记任务为执行中
    await this.prisma.jobQueue.update({
      where: { id: job.id },
      data: {
        status: 'ACTIVE',
        attempts: job.attempts + 1,
      },
    });

    try {
      // 执行任务
      await processor.process(job.data);

      // 标记任务完成
      await this.prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      this.logger.log(`任务执行成功: ${job.name} (${job.id})`);
    } catch (error) {
      this.logger.error(`任务执行失败: ${job.name} (${job.id}) - ${error.message}`);

      // 检查是否需要重试
      if (job.attempts + 1 >= job.maxAttempts) {
        await this.markJobFailed(job.id, error.message);
      } else {
        // 重新排队等待重试
        await this.prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'WAITING',
            error: error.message,
          },
        });
      }
    }
  }

  private async markJobFailed(jobId: string, error: string): Promise<void> {
    await this.prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error,
        processedAt: new Date(),
      },
    });
  }

  private registerBuiltinProcessors(): void {
    // 邮件发送处理器
    this.registerProcessor('send-email', {
      process: async (data) => {
        await this.emailService.sendEmail(data);
      },
    });

    // 批量邮件发送处理器
    this.registerProcessor('send-bulk-emails', {
      process: async (data) => {
        const { recipients, subject, template, variables } = data;
        await this.emailService.sendBulkEmails(recipients, subject, template, variables);
      },
    });

    // 审计日志清理处理器
    this.registerProcessor('cleanup-audit-logs', {
      process: async (data) => {
        const { days } = data;
        await this.auditService.cleanupOldLogs(days);
      },
    });

    // 文件清理处理器
    this.registerProcessor('cleanup-files', {
      process: async (data) => {
        // TODO: 实现文件清理逻辑
        this.logger.log('文件清理任务执行');
      },
    });

    // 数据备份处理器
    this.registerProcessor('backup-data', {
      process: async (data) => {
        // TODO: 实现数据备份逻辑
        this.logger.log('数据备份任务执行');
      },
    });

    // 统计报告生成处理器
    this.registerProcessor('generate-report', {
      process: async (data) => {
        // TODO: 实现报告生成逻辑
        this.logger.log('统计报告生成任务执行');
      },
    });
  }
}

// 队列任务工厂类
export class QueueJobFactory {
  static createEmailJob(emailOptions: any, priority = 0) {
    return {
      type: 'send-email',
      payload: emailOptions,
      priority,
    };
  }

  static createBulkEmailJob(recipients: string[], subject: string, template: string, variables: any = {}) {
    return {
      type: 'send-bulk-emails',
      payload: { recipients, subject, template, variables },
      priority: -1, // 批量邮件优先级较低
    };
  }

  static createCleanupJob(type: 'audit-logs' | 'files', days = 30) {
    return {
      type: `cleanup-${type}`,
      payload: { days },
      priority: -2, // 清理任务优先级最低
    };
  }

  static createBackupJob(tables?: string[]) {
    return {
      type: 'backup-data',
      payload: { tables },
      priority: 1, // 备份任务优先级较高
    };
  }

  static createReportJob(reportType: string, params: any = {}) {
    return {
      type: 'generate-report',
      payload: { reportType, params },
      priority: 0,
    };
  }
}
