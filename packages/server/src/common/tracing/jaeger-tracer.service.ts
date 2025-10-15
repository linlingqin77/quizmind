import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Jaeger链路追踪服务
 * 类似 Spring Cloud Sleuth + Zipkin
 */
@Injectable()
export class JaegerTracerService implements OnModuleInit {
  private tracer: any;
  private provider: NodeTracerProvider;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTracer();
  }

  /**
   * 初始化Jaeger追踪器
   */
  private async initializeTracer() {
    const serviceName = this.configService.get('SERVICE_NAME', 'ai-quiz-service');
    const jaegerEndpoint = this.configService.get('JAEGER_ENDPOINT', 'http://localhost:14268/api/traces');

    // 创建Jaeger导出器
    const exporter = new JaegerExporter({
      endpoint: jaegerEndpoint,
    });

    // 创建追踪器提供者
    this.provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.configService.get('APP_VERSION', '1.0.0'),
        environment: this.configService.get('NODE_ENV', 'development'),
      }),
    });

    // 添加处理器
    this.provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

    // 注册全局追踪器
    this.provider.register();

    // 获取追踪器实例
    this.tracer = trace.getTracer(serviceName);

    console.log(`✅ Jaeger tracer initialized for service: ${serviceName}`);
  }

  /**
   * 开始一个新的Span
   */
  startSpan(name: string, attributes?: Record<string, any>): Span {
    return this.tracer.startSpan(name, {
      attributes,
    });
  }

  /**
   * 在当前上下文中开始Span
   */
  startActiveSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, any>,
  ): Promise<T> {
    return this.tracer.startActiveSpan(
      name,
      { attributes },
      async (span: Span) => {
        try {
          const result = await fn(span);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
  }

  /**
   * 获取当前TraceId（类似Sleuth的traceId）
   */
  getCurrentTraceId(): string {
    const span = trace.getActiveSpan();
    if (!span) {
      return '';
    }
    return span.spanContext().traceId;
  }

  /**
   * 获取当前SpanId
   */
  getCurrentSpanId(): string {
    const span = trace.getActiveSpan();
    if (!span) {
      return '';
    }
    return span.spanContext().spanId;
  }

  /**
   * 添加事件到当前Span
   */
  addEvent(name: string, attributes?: Record<string, any>) {
    const span = trace.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * 设置Span属性
   */
  setAttribute(key: string, value: any) {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * 记录异常
   */
  recordException(error: Error) {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }

  /**
   * 注入追踪上下文到gRPC Metadata（用于跨服务传递）
   */
  injectContext(metadata: any) {
    const span = trace.getActiveSpan();
    if (span) {
      metadata.set('x-trace-id', span.spanContext().traceId);
      metadata.set('x-span-id', span.spanContext().spanId);
    }
    return metadata;
  }

  /**
   * 从gRPC Metadata提取追踪上下文
   */
  extractContext(metadata: any): any {
    const traceId = metadata.get('x-trace-id')?.[0];
    const spanId = metadata.get('x-span-id')?.[0];
    
    if (traceId && spanId) {
      return {
        traceId,
        spanId,
      };
    }
    return null;
  }

  /**
   * 关闭追踪器
   */
  async shutdown() {
    await this.provider.shutdown();
  }
}

