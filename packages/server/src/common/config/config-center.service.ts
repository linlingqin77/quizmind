import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Consul from 'consul';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ConfigWatcher {
  key: string;
  callback: (newValue: string, oldValue: string) => void;
}

/**
 * 配置中心服务
 * 类似 Spring Cloud Config / Nacos Config
 * 使用 Consul KV 作为配置存储
 */
@Injectable()
export class ConfigCenterService implements OnModuleInit {
  private readonly logger = new Logger(ConfigCenterService.name);
  private consul: Consul.Consul;
  private watchers: Map<string, ConfigWatcher> = new Map();
  private configCache: Map<string, string> = new Map();
  private watchIntervals: Map<string, NodeJS.Timer> = new Map();

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.consul = new Consul({
      host: this.configService.get('CONSUL_HOST', 'localhost'),
      port: this.configService.get('CONSUL_PORT', 8500),
    });
  }

  async onModuleInit() {
    await this.loadInitialConfig();
  }

  /**
   * 加载初始配置
   */
  private async loadInitialConfig() {
    const env = this.configService.get('NODE_ENV', 'development');
    const serviceName = this.configService.get('SERVICE_NAME', 'ai-quiz-service');
    
    // 配置键前缀：config/{env}/{service}/
    const configPrefix = `config/${env}/${serviceName}`;

    try {
      const result = await this.consul.kv.get({
        key: configPrefix,
        recurse: true,
      });

      if (result) {
        for (const item of result) {
          if (item.Value) {
            const key = item.Key.replace(`${configPrefix}/`, '');
            const value = item.Value;
            this.configCache.set(key, value);
          }
        }
      }

      this.logger.log(`Loaded ${this.configCache.size} config items from Consul`);
    } catch (error) {
      this.logger.error(`Failed to load config from Consul: ${error.message}`);
    }
  }

  /**
   * 获取配置值
   */
  async get<T = string>(key: string, defaultValue?: T): Promise<T> {
    // 先从缓存获取
    if (this.configCache.has(key)) {
      return this.parseValue(this.configCache.get(key)) as T;
    }

    // 从Consul获取
    try {
      const env = this.configService.get('NODE_ENV', 'development');
      const serviceName = this.configService.get('SERVICE_NAME', 'ai-quiz-service');
      const fullKey = `config/${env}/${serviceName}/${key}`;

      const result = await this.consul.kv.get(fullKey);
      
      if (result && result.Value) {
        const value = result.Value;
        this.configCache.set(key, value);
        return this.parseValue(value) as T;
      }
    } catch (error) {
      this.logger.error(`Failed to get config ${key}: ${error.message}`);
    }

    return defaultValue;
  }

  /**
   * 设置配置值
   */
  async set(key: string, value: any): Promise<boolean> {
    try {
      const env = this.configService.get('NODE_ENV', 'development');
      const serviceName = this.configService.get('SERVICE_NAME', 'ai-quiz-service');
      const fullKey = `config/${env}/${serviceName}/${key}`;

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await this.consul.kv.set(fullKey, stringValue);
      
      // 更新缓存
      this.configCache.set(key, stringValue);
      
      this.logger.log(`Config updated: ${key} = ${stringValue}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set config ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * 删除配置
   */
  async delete(key: string): Promise<boolean> {
    try {
      const env = this.configService.get('NODE_ENV', 'development');
      const serviceName = this.configService.get('SERVICE_NAME', 'ai-quiz-service');
      const fullKey = `config/${env}/${serviceName}/${key}`;

      await this.consul.kv.del(fullKey);
      
      // 从缓存删除
      this.configCache.delete(key);
      
      this.logger.log(`Config deleted: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete config ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * 监听配置变化（动态刷新）
   * 类似 Spring Cloud Config 的 @RefreshScope
   */
  watch(key: string, callback: (newValue: string, oldValue: string) => void) {
    const watcher: ConfigWatcher = { key, callback };
    this.watchers.set(key, watcher);

    // 启动轮询监听
    const interval = setInterval(async () => {
      const oldValue = this.configCache.get(key);
      const newValue = await this.get(key);

      if (newValue !== oldValue) {
        this.logger.log(`Config changed: ${key} = ${newValue} (old: ${oldValue})`);
        
        // 更新缓存
        this.configCache.set(key, newValue as string);
        
        // 触发回调
        callback(newValue as string, oldValue);
        
        // 发送事件
        this.eventEmitter.emit('config.changed', {
          key,
          newValue,
          oldValue,
        });
      }
    }, 5000); // 每5秒检查一次

    this.watchIntervals.set(key, interval);
    
    this.logger.log(`Started watching config: ${key}`);
  }

  /**
   * 停止监听
   */
  unwatch(key: string) {
    const interval = this.watchIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.watchIntervals.delete(key);
    }
    
    this.watchers.delete(key);
    this.logger.log(`Stopped watching config: ${key}`);
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, string> {
    const config: Record<string, string> = {};
    this.configCache.forEach((value, key) => {
      config[key] = value;
    });
    return config;
  }

  /**
   * 刷新所有配置
   */
  async refresh(): Promise<void> {
    this.logger.log('Refreshing all configs...');
    this.configCache.clear();
    await this.loadInitialConfig();
    this.eventEmitter.emit('config.refreshed');
  }

  /**
   * 解析配置值
   */
  private parseValue(value: string): any {
    if (!value) {
      return value;
    }

    // 尝试解析JSON
    try {
      return JSON.parse(value);
    } catch {
      // 尝试解析布尔值
      if (value === 'true') return true;
      if (value === 'false') return false;
      
      // 尝试解析数字
      if (!isNaN(Number(value))) {
        return Number(value);
      }
      
      // 返回原始字符串
      return value;
    }
  }

  /**
   * 清理资源
   */
  async onModuleDestroy() {
    // 停止所有监听
    this.watchIntervals.forEach((interval) => clearInterval(interval));
    this.watchIntervals.clear();
    this.watchers.clear();
  }
}

