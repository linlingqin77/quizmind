import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 审计日志服务
 * 记录系统中的重要操作
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 记录审计日志
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      this.logger.log(
        `审计日志: ${data.action} ${data.resource}${data.resourceId ? ` (${data.resourceId})` : ''} by ${data.userId || 'system'}`,
      );
    } catch (error) {
      this.logger.error(`记录审计日志失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 记录用户登录
   */
  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录用户登出
   */
  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      resource: 'USER',
      resourceId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录创建操作
   */
  async logCreate(
    userId: string,
    resource: string,
    resourceId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录更新操作
   */
  async logUpdate(
    userId: string,
    resource: string,
    resourceId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 记录删除操作
   */
  async logDelete(
    userId: string,
    resource: string,
    resourceId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DELETE',
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 获取审计日志列表
   */
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = params;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取用户操作统计
   */
  async getUserActionStats(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        userId,
        timestamp: {
          gte: startDate,
        },
      },
      _count: {
        action: true,
      },
    });

    return stats.map((stat) => ({
      action: stat.action,
      count: stat._count.action,
    }));
  }

  /**
   * 获取系统操作统计
   */
  async getSystemStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [actionStats, resourceStats, dailyStats] = await Promise.all([
      // 按操作类型统计
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        _count: {
          action: true,
        },
      }),
      // 按资源类型统计
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        _count: {
          resource: true,
        },
      }),
      // 按日期统计
      this.prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM audit_logs 
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `,
    ]);

    return {
      actionStats: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count.action,
      })),
      resourceStats: resourceStats.map((stat) => ({
        resource: stat.resource,
        count: stat._count.resource,
      })),
      dailyStats,
    };
  }

  /**
   * 清理过期日志
   */
  async cleanupOldLogs(days = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`清理了 ${result.count} 条过期审计日志`);
    return result.count;
  }
}