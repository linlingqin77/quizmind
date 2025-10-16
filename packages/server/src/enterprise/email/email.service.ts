import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  variables?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * 邮件服务
 * 支持模板邮件、附件、批量发送等功能
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate> = new Map();
  private readonly templatesDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.templatesDir = path.join(process.cwd(), 'src/modules/email/templates');
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * 发送邮件
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, template, variables, html, text, attachments } = options;

      let emailHtml = html;
      let emailText = text;
      let emailSubject = subject;

      // 使用模板
      if (template) {
        const templateData = await this.renderTemplate(template, variables || {});
        emailHtml = templateData.html;
        emailText = templateData.text;
        emailSubject = templateData.subject;
      }

      const recipients = Array.isArray(to) ? to : [to];

      // 发送邮件
      for (const recipient of recipients) {
        const mailOptions = {
          from: this.configService.get('SMTP_FROM'),
          to: recipient,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
          attachments,
        };

        const result = await this.transporter.sendMail(mailOptions);

        // 记录邮件日志
        await this.logEmail({
          to: recipient,
          from: this.configService.get('SMTP_FROM'),
          subject: emailSubject,
          template,
          variables,
          status: 'SENT',
          sentAt: new Date(),
        });

        this.logger.log(`邮件发送成功: ${recipient} - ${emailSubject}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`邮件发送失败: ${error.message}`, error.stack);

      // 记录失败日志
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      for (const recipient of recipients) {
        await this.logEmail({
          to: recipient,
          from: this.configService.get('SMTP_FROM'),
          subject: options.subject,
          template: options.template,
          variables: options.variables,
          status: 'FAILED',
          error: error.message,
        });
      }

      return false;
    }
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: '邮箱验证',
      template: 'verification',
      variables: {
        verificationUrl,
        appName: this.configService.get('APP_NAME', 'AI Quiz System'),
      },
    });
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: '密码重置',
      template: 'password-reset',
      variables: {
        resetUrl,
        appName: this.configService.get('APP_NAME', 'AI Quiz System'),
      },
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: '欢迎加入',
      template: 'welcome',
      variables: {
        username,
        appName: this.configService.get('APP_NAME', 'AI Quiz System'),
        loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
      },
    });
  }

  /**
   * 发送考试通知邮件
   */
  async sendExamNotificationEmail(
    email: string,
    examTitle: string,
    startTime: Date,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `考试通知: ${examTitle}`,
      template: 'exam-notification',
      variables: {
        examTitle,
        startTime: startTime.toLocaleString('zh-CN'),
        examUrl: `${this.configService.get('FRONTEND_URL')}/exams`,
      },
    });
  }

  /**
   * 发送考试结果邮件
   */
  async sendExamResultEmail(
    email: string,
    examTitle: string,
    score: number,
    totalScore: number,
  ): Promise<boolean> {
    const percentage = Math.round((score / totalScore) * 100);

    return this.sendEmail({
      to: email,
      subject: `考试结果: ${examTitle}`,
      template: 'exam-result',
      variables: {
        examTitle,
        score,
        totalScore,
        percentage,
        passed: percentage >= 60,
      },
    });
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(
    recipients: string[],
    subject: string,
    template: string,
    variables: Record<string, any> = {},
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const sent = await this.sendEmail({
        to: recipient,
        subject,
        template,
        variables,
      });

      if (sent) {
        success++;
      } else {
        failed++;
      }

      // 添加延迟避免被限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.log(`批量邮件发送完成: 成功 ${success}, 失败 ${failed}`);

    return { success, failed };
  }

  /**
   * 获取邮件发送统计
   */
  async getEmailStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [statusStats, templateStats, dailyStats] = await Promise.all([
      // 按状态统计
      this.prisma.emailLog.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          status: true,
        },
      }),
      // 按模板统计
      this.prisma.emailLog.groupBy({
        by: ['template'],
        where: {
          createdAt: {
            gte: startDate,
          },
          template: {
            not: null,
          },
        },
        _count: {
          template: true,
        },
      }),
      // 按日期统计
      this.prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM email_logs 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);

    return {
      statusStats: statusStats.map((stat) => ({
        status: stat.status,
        count: stat._count.status,
      })),
      templateStats: templateStats.map((stat) => ({
        template: stat.template,
        count: stat._count.template,
      })),
      dailyStats,
    };
  }

  private async initializeTransporter(): Promise<void> {
    const smtpConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);

    // 验证连接
    try {
      await this.transporter.verify();
      this.logger.log('SMTP连接验证成功');
    } catch (error) {
      this.logger.error(`SMTP连接验证失败: ${error.message}`);
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templateFiles = await fs.readdir(this.templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(this.templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');

          // 解析模板元数据（如果存在）
          const metaMatch = templateContent.match(/{{!--\s*META:(.*?)\s*--}}/s);
          let subject = templateName;
          
          if (metaMatch) {
            try {
              const meta = JSON.parse(metaMatch[1]);
              subject = meta.subject || subject;
            } catch {}
          }

          this.templates.set(templateName, {
            name: templateName,
            subject,
            html: templateContent,
          });
        }
      }

      this.logger.log(`加载了 ${this.templates.size} 个邮件模板`);
    } catch (error) {
      this.logger.warn(`加载邮件模板失败: ${error.message}`);
    }
  }

  private async renderTemplate(
    templateName: string,
    variables: Record<string, any>,
  ): Promise<{ html: string; text?: string; subject: string }> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`邮件模板不存在: ${templateName}`);
    }

    const compiledTemplate = handlebars.compile(template.html);
    const html = compiledTemplate(variables);

    // 编译主题模板
    const compiledSubject = handlebars.compile(template.subject);
    const subject = compiledSubject(variables);

    return {
      html,
      text: template.text ? handlebars.compile(template.text)(variables) : undefined,
      subject,
    };
  }

  private async logEmail(data: {
    to: string;
    from: string;
    subject: string;
    template?: string;
    variables?: Record<string, any>;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED';
    error?: string;
    sentAt?: Date;
  }): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          to: data.to,
          from: data.from,
          subject: data.subject,
          template: data.template,
          variables: data.variables,
          status: data.status,
          error: data.error,
          sentAt: data.sentAt,
        },
      });
    } catch (error) {
      this.logger.error(`记录邮件日志失败: ${error.message}`);
    }
  }
}
