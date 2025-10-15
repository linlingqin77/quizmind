import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Consul from 'consul';

/**
 * 服务注册中心
 * 类似 Spring Cloud Eureka
 */
@Injectable()
export class ServiceRegistry implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceRegistry.name);
  private consul: Consul.Consul;
  private serviceId: string;

  constructor(private configService: ConfigService) {
    this.consul = new Consul({
      host: this.configService.get('CONSUL_HOST', 'localhost'),
      port: this.configService.get('CONSUL_PORT', 8500),
    });
  }

  async onModuleInit() {
    await this.register();
  }

  async onModuleDestroy() {
    await this.deregister();
  }

  /**
   * 注册服务到 Consul
   */
  async register() {
    const serviceName = this.configService.get('SERVICE_NAME', 'ai-quiz-service');
    const servicePort = this.configService.get('PORT', 3000);
    const serviceHost = this.configService.get('SERVICE_HOST', 'localhost');

    this.serviceId = `${serviceName}-${serviceHost}-${servicePort}`;

    try {
      await this.consul.agent.service.register({
        id: this.serviceId,
        name: serviceName,
        address: serviceHost,
        port: servicePort,
        tags: ['nestjs', 'microservice'],
        check: {
          http: `http://${serviceHost}:${servicePort}/health`,
          interval: '10s',
          timeout: '5s',
          deregistercriticalserviceafter: '30s',
        },
        meta: {
          version: this.configService.get('APP_VERSION', '1.0.0'),
          env: this.configService.get('NODE_ENV', 'development'),
        },
      });

      this.logger.log(`Service registered: ${this.serviceId}`);
    } catch (error) {
      this.logger.error(`Failed to register service: ${error.message}`);
    }
  }

  /**
   * 注销服务
   */
  async deregister() {
    try {
      await this.consul.agent.service.deregister(this.serviceId);
      this.logger.log(`Service deregistered: ${this.serviceId}`);
    } catch (error) {
      this.logger.error(`Failed to deregister service: ${error.message}`);
    }
  }

  /**
   * 发现服务实例
   */
  async discoverService(serviceName: string): Promise<string[]> {
    try {
      const result = await this.consul.health.service({
        service: serviceName,
        passing: true,
      });

      return result.map((entry) => {
        const service = entry.Service;
        return `http://${service.Address}:${service.Port}`;
      });
    } catch (error) {
      this.logger.error(`Failed to discover service ${serviceName}: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取服务实例（负载均衡）
   */
  async getServiceInstance(serviceName: string): Promise<string | null> {
    const instances = await this.discoverService(serviceName);
    
    if (instances.length === 0) {
      return null;
    }

    // 随机负载均衡
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }
}
