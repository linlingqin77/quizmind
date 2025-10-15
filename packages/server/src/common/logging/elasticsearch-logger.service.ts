import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { JaegerTracerService } from '../tracing/jaeger-tracer.service';

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  traceId?: string;
  spanId?: string;
  message: string;
  context?: string;
  metadata?: any;
  stack?: string;
}

/**
 * Elasticsearch日志服务
 * 类似 Spring Cloud Sleuth + Logstash
 * 将日志发送到Elasticsearch，支持TraceId关联
 */
@Injectable()
export class ElasticsearchLoggerService implements NestLoggerService {
  private elasticsearchClient: ElasticsearchClient;
  private serviceName: string;
  private indexPrefix: string;
  private bufferSize: number = 100;
  private flushInterval: number = 5000; // 5秒
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timer;

  constructor(
    private configService: ConfigService,
    private tracer?: JaegerTracerService,
  ) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'unknown');
    this.indexPrefix = this.configService.get('ELASTICSEARCH_INDEX_PREFIX', 'logs');
    
    // 初始化Elasticsearch客户端
    const esNode = this.configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200');
    const esUsername = this.configService.get('ELASTICSEARCH_USERNAME');
    const esPassword = this.configService.get('ELASTICSEARCH_PASSWORD');
    
    this.elasticsearchClient = new ElasticsearchClient({
      node: esNode,
      auth: esUsername && esPassword ? {
        username: esUsername,
        password: esPassword,
      } : undefined,
    });
    
    // 启动定时刷新
    this.startFlushTimer();
  }

  /**
   * 启动定时刷新定时器
   */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * 创建日志条目
   */
  private createLogEntry(
    level: string,
    message: string,
    context?: string,
    metadata?: any,
    stack?: string,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      context,
      metadata,
      stack,
    };
    
    // 添加TraceId和SpanId（用于日志关联）
    if (this.tracer) {
      entry.traceId = this.tracer.getCurrentTraceId();
      entry.spanId = this.tracer.getCurrentSpanId();
    }
    
    return entry;
  }

  /**
   * 将日志添加到缓冲区
   */
  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    // 如果缓冲区满了，立即刷新
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  /**
   * 刷新缓冲区到Elasticsearch
   */
  private async flush() {
    if (this.logBuffer.length === 0) {
      return;
    }
    
    const logs = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // 批量写入Elasticsearch
      const body = logs.flatMap(log => {
        const index = `${this.indexPrefix}-${new Date().toISOString().split('T')[0]}`;
        return [
          { index: { _index: index } },
          log,
        ];
      });
      
      await this.elasticsearchClient.bulk({ body });
    } catch (error) {
      console.error('Failed to flush logs to Elasticsearch:', error);
      // 如果失败，将日志写回缓冲区
      this.logBuffer.unshift(...logs);
    }
  }

  /**
   * 同步日志（用于控制台输出）
   */
  private syncLog(level: string, message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const traceId = this.tracer?.getCurrentTraceId() || '';
    const contextStr = context ? `[${context}]` : '';
    const traceStr = traceId ? `[${traceId}]` : '';
    
    console.log(`${timestamp} ${level.toUpperCase()} ${traceStr}${contextStr} ${message}`);
  }

  // ==================== NestJS LoggerService接口实现 ====================

  log(message: any, context?: string) {
    this.syncLog('info', message, context);
    const entry = this.createLogEntry('info', message, context);
    this.addToBuffer(entry);
  }

  error(message: any, trace?: string, context?: string) {
    this.syncLog('error', message, context);
    const entry = this.createLogEntry('error', message, context, undefined, trace);
    this.addToBuffer(entry);
  }

  warn(message: any, context?: string) {
    this.syncLog('warn', message, context);
    const entry = this.createLogEntry('warn', message, context);
    this.addToBuffer(entry);
  }

  debug(message: any, context?: string) {
    if (this.configService.get('LOG_LEVEL') === 'debug') {
      this.syncLog('debug', message, context);
      const entry = this.createLogEntry('debug', message, context);
      this.addToBuffer(entry);
    }
  }

  verbose(message: any, context?: string) {
    if (this.configService.get('LOG_LEVEL') === 'verbose') {
      this.syncLog('verbose', message, context);
      const entry = this.createLogEntry('verbose', message, context);
      this.addToBuffer(entry);
    }
  }

  // ==================== 扩展方法 ====================

  /**
   * 记录带元数据的日志
   */
  logWithMetadata(
    level: string,
    message: string,
    metadata: any,
    context?: string,
  ) {
    this.syncLog(level, message, context);
    const entry = this.createLogEntry(level, message, context, metadata);
    this.addToBuffer(entry);
  }

  /**
   * 记录HTTP请求
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ) {
    const metadata = {
      type: 'http_request',
      method,
      url,
      statusCode,
      duration,
      userId,
    };
    
    this.logWithMetadata('info', `${method} ${url} ${statusCode} ${duration}ms`, metadata, 'HTTP');
  }

  /**
   * 记录gRPC调用
   */
  logGrpcCall(
    service: string,
    method: string,
    duration: number,
    success: boolean,
  ) {
    const metadata = {
      type: 'grpc_call',
      service,
      method,
      duration,
      success,
    };
    
    const level = success ? 'info' : 'error';
    this.logWithMetadata(level, `gRPC ${service}.${method} ${duration}ms`, metadata, 'gRPC');
  }

  /**
   * 记录数据库查询
   */
  logDbQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
  ) {
    const metadata = {
      type: 'db_query',
      operation,
      table,
      duration,
      success,
    };
    
    this.logWithMetadata('debug', `DB ${operation} ${table} ${duration}ms`, metadata, 'Database');
  }

  /**
   * 记录业务事件
   */
  logBusinessEvent(
    eventName: string,
    eventData: any,
    userId?: string,
  ) {
    const metadata = {
      type: 'business_event',
      eventName,
      eventData,
      userId,
    };
    
    this.logWithMetadata('info', `Event: ${eventName}`, metadata, 'Business');
  }

  /**
   * 搜索日志
   */
  async searchLogs(query: any, from: number = 0, size: number = 100) {
    try {
      const result = await this.elasticsearchClient.search({
        index: `${this.indexPrefix}-*`,
        body: {
          from,
          size,
          query,
          sort: [{ timestamp: { order: 'desc' } }],
        },
      });
      
      return result.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.error('Failed to search logs:', error);
      return [];
    }
  }

  /**
   * 根据TraceId搜索日志
   */
  async searchByTraceId(traceId: string) {
    return this.searchLogs({
      match: { traceId },
    });
  }

  /**
   * 根据服务名搜索日志
   */
  async searchByService(serviceName: string, from: number = 0, size: number = 100) {
    return this.searchLogs({
      match: { service: serviceName },
    }, from, size);
  }

  /**
   * 清理资源
   */
  async onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // 刷新剩余日志
    await this.flush();
    
    // 关闭Elasticsearch连接
    await this.elasticsearchClient.close();
  }
}

