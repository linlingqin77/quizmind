import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { AsyncLocalStorage } from 'async_hooks';
const chalk = require('chalk');

/**
 * 企业级日志服务
 * 提供结构化日志、请求追踪、日志轮转等功能
 */
@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private asyncLocalStorage = new AsyncLocalStorage<{ requestId: string }>();

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.metadata(),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'ai-quiz-backend',
        env: process.env.NODE_ENV || 'development',
      },
      transports: this.createTransports(),
    });
  }

  /**
   * 创建日志传输器
   */
  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // 控制台输出（开发环境使用彩色格式）
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.printf((info) => {
              const { level, message, context, requestId, metadata, timestamp, ...meta } = info;
              
              // 过滤掉内部元数据
              const filteredMeta = { ...meta };
              delete filteredMeta.service;
              delete filteredMeta.env;
              
              // 格式化时间戳
              const ts = timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
              const timeStr = chalk.gray(ts);
              
              // 根据日志级别设置颜色
              let levelStr = '';
              let msgColor = chalk.white;
              
              switch (level) {
                case 'error':
                  levelStr = chalk.red.bold('ERROR');
                  msgColor = chalk.red;
                  break;
                case 'warn':
                  levelStr = chalk.yellow.bold('WARN ');
                  msgColor = chalk.yellow;
                  break;
                case 'info':
                  levelStr = chalk.green.bold('INFO ');
                  msgColor = chalk.white;
                  break;
                case 'debug':
                  levelStr = chalk.blue.bold('DEBUG');
                  msgColor = chalk.blue;
                  break;
                case 'verbose':
                  levelStr = chalk.cyan.bold('VERB ');
                  msgColor = chalk.cyan;
                  break;
                default:
                  levelStr = chalk.white(level.toUpperCase().padEnd(5));
              }
              
              // 格式化上下文
              const ctx = context ? chalk.magenta(`[${context}]`) : '';
              
              // 格式化请求ID
              const reqId = requestId ? chalk.cyan(`[${String(requestId).substring(0, 8)}]`) : '';
              
              // 格式化消息（保留 emoji）
              const msg = msgColor(message);
              
              // 格式化元数据
              const metaStr = Object.keys(filteredMeta).length 
                ? chalk.gray(` ${JSON.stringify(filteredMeta)}`) 
                : '';
              
              return `${timeStr} ${levelStr} ${ctx}${reqId}: ${msg}${metaStr}`;
            }),
          ),
        }),
      );
    } else {
      transports.push(
        new winston.transports.Console({
          format: winston.format.json(),
        }),
      );
    }

    // 错误日志文件（生产环境）
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );

      // 所有日志文件
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    return transports;
  }

  /**
   * 设置请求 ID（用于追踪单个请求）
   */
  setRequestId(requestId: string) {
    this.asyncLocalStorage.enterWith({ requestId });
  }

  /**
   * 获取当前请求 ID
   */
  getRequestId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.requestId;
  }

  /**
   * 通用日志方法
   */
  private writeLog(
    level: string,
    message: string,
    context?: string,
    meta?: Record<string, any>,
  ) {
    const requestId = this.getRequestId();
    this.logger.log(level, message, {
      context,
      requestId,
      ...meta,
    });
  }

  /**
   * 普通日志
   */
  log(message: string, context?: string) {
    this.writeLog('info', message, context);
  }

  /**
   * 错误日志
   */
  error(message: string, trace?: string, context?: string) {
    this.writeLog('error', message, context, { trace });
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: string) {
    this.writeLog('warn', message, context);
  }

  /**
   * 调试日志
   */
  debug(message: string, context?: string) {
    this.writeLog('debug', message, context);
  }

  /**
   * 详细日志
   */
  verbose(message: string, context?: string) {
    this.writeLog('verbose', message, context);
  }

  /**
   * 带元数据的日志
   */
  logWithMeta(
    level: 'info' | 'error' | 'warn' | 'debug',
    message: string,
    meta: Record<string, any>,
    context?: string,
  ) {
    this.writeLog(level, message, context, meta);
  }

  /**
   * 性能日志
   */
  logPerformance(
    operation: string,
    duration: number,
    context?: string,
    meta?: Record<string, any>,
  ) {
    this.writeLog('info', `[PERFORMANCE] ${operation}`, context, {
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * API 请求日志
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ) {
    this.writeLog('info', `[HTTP] ${method} ${url}`, 'HTTP', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
    });
  }

  /**
   * 数据库查询日志
   */
  logQuery(query: string, duration: number, params?: any) {
    this.writeLog('debug', `[DB] ${query}`, 'Database', {
      query,
      duration: `${duration}ms`,
      params,
    });
  }

  /**
   * 业务日志
   */
  logBusiness(
    action: string,
    userId: string,
    resource: string,
    meta?: Record<string, any>,
  ) {
    this.writeLog('info', `[BUSINESS] ${action}`, 'Business', {
      action,
      userId,
      resource,
      ...meta,
    });
  }
}

