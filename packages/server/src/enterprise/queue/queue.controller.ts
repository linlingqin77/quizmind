import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { Audit } from '../../shared/interceptors/audit.interceptor';
import { QueueService, QueueJobFactory } from './queue.service';

@Controller('admin/queue')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('system:admin')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * 获取队列统计信息
   */
  @Get('stats')
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  /**
   * 获取失败的任务
   */
  @Get('failed')
  async getFailedJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queueService.getFailedJobs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * 重试失败的任务
   */
  @Put('retry/:id')
  @Audit({ action: 'RETRY', resource: 'JOB' })
  async retryJob(@Param('id') id: string) {
    await this.queueService.retryJob(id);
    return { message: '任务已重新排队' };
  }

  /**
   * 清理已完成的任务
   */
  @Delete('cleanup')
  @Audit({ action: 'CLEANUP', resource: 'JOB' })
  async cleanupJobs(@Query('days') days?: string) {
    const cleanupDays = days ? parseInt(days) : 7;
    const count = await this.queueService.cleanupCompletedJobs(cleanupDays);
    return { message: `已清理 ${count} 个任务` };
  }

  /**
   * 暂停队列处理
   */
  @Post('pause')
  @Audit({ action: 'PAUSE', resource: 'QUEUE' })
  async pauseQueue() {
    this.queueService.pauseProcessing();
    return { message: '队列处理已暂停' };
  }

  /**
   * 恢复队列处理
   */
  @Post('resume')
  @Audit({ action: 'RESUME', resource: 'QUEUE' })
  async resumeQueue() {
    this.queueService.resumeProcessing();
    return { message: '队列处理已恢复' };
  }

  /**
   * 添加测试任务
   */
  @Post('test')
  @Audit({ action: 'ADD_TEST_JOB', resource: 'JOB' })
  async addTestJob(@Body() body: { type: string; data?: any }) {
    let job;

    switch (body.type) {
      case 'email':
        job = QueueJobFactory.createEmailJob({
          to: 'test@example.com',
          subject: '测试邮件',
          template: 'welcome',
          variables: { username: '测试用户', appName: 'AI Quiz System' },
        });
        break;

      case 'cleanup':
        job = QueueJobFactory.createCleanupJob('audit-logs', 30);
        break;

      case 'backup':
        job = QueueJobFactory.createBackupJob();
        break;

      case 'report':
        job = QueueJobFactory.createReportJob('user-stats');
        break;

      default:
        return { error: '不支持的任务类型' };
    }

    const jobId = await this.queueService.addJob(job.type, job);
    return { message: '测试任务已添加', jobId };
  }

  /**
   * 添加批量邮件任务
   */
  @Post('bulk-email')
  @Audit({ action: 'ADD_BULK_EMAIL', resource: 'JOB' })
  async addBulkEmailJob(@Body() body: {
    recipients: string[];
    subject: string;
    template: string;
    variables?: any;
  }) {
    const job = QueueJobFactory.createBulkEmailJob(
      body.recipients,
      body.subject,
      body.template,
      body.variables,
    );

    const jobId = await this.queueService.addJob(job.type, job);
    return { message: '批量邮件任务已添加', jobId };
  }

  /**
   * 添加定时清理任务
   */
  @Post('schedule-cleanup')
  @Audit({ action: 'SCHEDULE_CLEANUP', resource: 'JOB' })
  async scheduleCleanup(@Body() body: {
    type: 'audit-logs' | 'files';
    days?: number;
    delay?: number;
  }) {
    const job = QueueJobFactory.createCleanupJob(body.type, body.days);
    
    if (body.delay) {
      job.delay = body.delay;
    }

    const jobId = await this.queueService.addJob(job.type, job);
    return { message: '清理任务已计划', jobId };
  }
}
