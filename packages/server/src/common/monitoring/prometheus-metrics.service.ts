import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  register,
  Registry,
  Counter,
  Histogram,
  Gauge,
  Summary,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Prometheus指标收集服务
 * 类似 Spring Boot Actuator + Micrometer
 */
@Injectable()
export class PrometheusMetricsService implements OnModuleInit {
  private readonly registry: Registry;
  
  // HTTP请求指标
  public readonly httpRequestTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly httpRequestSize: Summary;
  public readonly httpResponseSize: Summary;
  
  // gRPC调用指标
  public readonly grpcCallTotal: Counter;
  public readonly grpcCallDuration: Histogram;
  public readonly grpcCallErrors: Counter;
  
  // 业务指标
  public readonly activeUsers: Gauge;
  public readonly activeConnections: Gauge;
  public readonly queueSize: Gauge;
  
  // 数据库指标
  public readonly dbQueryTotal: Counter;
  public readonly dbQueryDuration: Histogram;
  public readonly dbConnectionPool: Gauge;
  
  // 缓存指标
  public readonly cacheHits: Counter;
  public readonly cacheMisses: Counter;
  
  // AI服务指标
  public readonly aiRequestTotal: Counter;
  public readonly aiRequestDuration: Histogram;
  public readonly aiTokensUsed: Counter;

  constructor(private configService: ConfigService) {
    this.registry = register;
    
    // ==================== HTTP指标 ====================
    
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code', 'service'],
      registers: [this.registry],
    });
    
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status_code', 'service'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });
    
    this.httpRequestSize = new Summary({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP request in bytes',
      labelNames: ['method', 'path', 'service'],
      registers: [this.registry],
    });
    
    this.httpResponseSize = new Summary({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP response in bytes',
      labelNames: ['method', 'path', 'status_code', 'service'],
      registers: [this.registry],
    });
    
    // ==================== gRPC指标 ====================
    
    this.grpcCallTotal = new Counter({
      name: 'grpc_calls_total',
      help: 'Total number of gRPC calls',
      labelNames: ['service', 'method', 'status'],
      registers: [this.registry],
    });
    
    this.grpcCallDuration = new Histogram({
      name: 'grpc_call_duration_seconds',
      help: 'Duration of gRPC calls in seconds',
      labelNames: ['service', 'method', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });
    
    this.grpcCallErrors = new Counter({
      name: 'grpc_call_errors_total',
      help: 'Total number of gRPC call errors',
      labelNames: ['service', 'method', 'error_code'],
      registers: [this.registry],
    });
    
    // ==================== 业务指标 ====================
    
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of active users',
      labelNames: ['service'],
      registers: [this.registry],
    });
    
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['service', 'protocol'],
      registers: [this.registry],
    });
    
    this.queueSize = new Gauge({
      name: 'queue_size',
      help: 'Size of message queue',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });
    
    // ==================== 数据库指标 ====================
    
    this.dbQueryTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.registry],
    });
    
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });
    
    this.dbConnectionPool = new Gauge({
      name: 'db_connection_pool_size',
      help: 'Size of database connection pool',
      labelNames: ['state'], // 'active', 'idle', 'waiting'
      registers: [this.registry],
    });
    
    // ==================== 缓存指标 ====================
    
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });
    
    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
      registers: [this.registry],
    });
    
    // ==================== AI服务指标 ====================
    
    this.aiRequestTotal = new Counter({
      name: 'ai_requests_total',
      help: 'Total number of AI requests',
      labelNames: ['provider', 'model', 'status'],
      registers: [this.registry],
    });
    
    this.aiRequestDuration = new Histogram({
      name: 'ai_request_duration_seconds',
      help: 'Duration of AI requests in seconds',
      labelNames: ['provider', 'model'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });
    
    this.aiTokensUsed = new Counter({
      name: 'ai_tokens_used_total',
      help: 'Total number of AI tokens used',
      labelNames: ['provider', 'model', 'type'], // 'prompt', 'completion'
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // 收集默认系统指标
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'nodejs_',
    });
  }

  /**
   * 获取所有指标（用于 /metrics 端点）
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * 获取指标的内容类型
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * 记录HTTP请求
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestSize?: number,
    responseSize?: number,
  ) {
    const serviceName = this.configService.get('SERVICE_NAME', 'unknown');
    
    this.httpRequestTotal.inc({
      method,
      path,
      status_code: statusCode,
      service: serviceName,
    });
    
    this.httpRequestDuration.observe(
      {
        method,
        path,
        status_code: statusCode,
        service: serviceName,
      },
      duration,
    );
    
    if (requestSize) {
      this.httpRequestSize.observe(
        { method, path, service: serviceName },
        requestSize,
      );
    }
    
    if (responseSize) {
      this.httpResponseSize.observe(
        { method, path, status_code: statusCode, service: serviceName },
        responseSize,
      );
    }
  }

  /**
   * 记录gRPC调用
   */
  recordGrpcCall(
    service: string,
    method: string,
    status: string,
    duration: number,
    isError: boolean = false,
    errorCode?: string,
  ) {
    this.grpcCallTotal.inc({ service, method, status });
    this.grpcCallDuration.observe({ service, method, status }, duration);
    
    if (isError && errorCode) {
      this.grpcCallErrors.inc({ service, method, error_code: errorCode });
    }
  }

  /**
   * 记录数据库查询
   */
  recordDbQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean = true,
  ) {
    const status = success ? 'success' : 'error';
    
    this.dbQueryTotal.inc({ operation, table, status });
    this.dbQueryDuration.observe({ operation, table }, duration);
  }

  /**
   * 更新活跃用户数
   */
  setActiveUsers(count: number) {
    const serviceName = this.configService.get('SERVICE_NAME', 'unknown');
    this.activeUsers.set({ service: serviceName }, count);
  }

  /**
   * 更新活跃连接数
   */
  setActiveConnections(count: number, protocol: string = 'grpc') {
    const serviceName = this.configService.get('SERVICE_NAME', 'unknown');
    this.activeConnections.set({ service: serviceName, protocol }, count);
  }

  /**
   * 更新队列大小
   */
  setQueueSize(queueName: string, size: number) {
    this.queueSize.set({ queue_name: queueName }, size);
  }

  /**
   * 更新数据库连接池状态
   */
  setDbConnectionPool(active: number, idle: number, waiting: number = 0) {
    this.dbConnectionPool.set({ state: 'active' }, active);
    this.dbConnectionPool.set({ state: 'idle' }, idle);
    this.dbConnectionPool.set({ state: 'waiting' }, waiting);
  }

  /**
   * 记录缓存命中
   */
  recordCacheHit(cacheName: string) {
    this.cacheHits.inc({ cache_name: cacheName });
  }

  /**
   * 记录缓存未命中
   */
  recordCacheMiss(cacheName: string) {
    this.cacheMisses.inc({ cache_name: cacheName });
  }

  /**
   * 记录AI请求
   */
  recordAiRequest(
    provider: string,
    model: string,
    duration: number,
    promptTokens: number,
    completionTokens: number,
    success: boolean = true,
  ) {
    const status = success ? 'success' : 'error';
    
    this.aiRequestTotal.inc({ provider, model, status });
    this.aiRequestDuration.observe({ provider, model }, duration);
    this.aiTokensUsed.inc({ provider, model, type: 'prompt' }, promptTokens);
    this.aiTokensUsed.inc({ provider, model, type: 'completion' }, completionTokens);
  }

  /**
   * 重置所有指标
   */
  reset() {
    this.registry.resetMetrics();
  }
}

