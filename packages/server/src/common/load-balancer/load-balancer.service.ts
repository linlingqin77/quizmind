import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ServiceInstance {
  id: string;
  host: string;
  port: number;
  weight: number;
  activeConnections: number;
  healthy: boolean;
  version?: string;
}

export enum LoadBalanceStrategy {
  RANDOM = 'random',
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  CONSISTENT_HASH = 'consistent_hash',
  IP_HASH = 'ip_hash',
}

/**
 * 负载均衡服务
 * 类似 Spring Cloud LoadBalancer / Ribbon
 * 支持多种负载均衡算法
 */
@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  
  // 轮询索引
  private roundRobinIndices = new Map<string, number>();
  
  // 加权轮询状态
  private weightedRoundRobinState = new Map<string, {
    currentWeight: number[];
    effectiveWeight: number[];
  }>();
  
  // 一致性哈希环
  private consistentHashRings = new Map<string, Map<number, ServiceInstance>>();
  private readonly virtualNodesPerInstance = 150;

  /**
   * 选择服务实例
   */
  selectInstance(
    serviceName: string,
    instances: ServiceInstance[],
    strategy: LoadBalanceStrategy = LoadBalanceStrategy.ROUND_ROBIN,
    context?: any,
  ): ServiceInstance | null {
    // 过滤健康的实例
    const healthyInstances = instances.filter(i => i.healthy);
    
    if (healthyInstances.length === 0) {
      this.logger.warn(`No healthy instances available for service: ${serviceName}`);
      return null;
    }
    
    if (healthyInstances.length === 1) {
      return healthyInstances[0];
    }
    
    // 根据策略选择实例
    switch (strategy) {
      case LoadBalanceStrategy.RANDOM:
        return this.randomSelect(healthyInstances);
        
      case LoadBalanceStrategy.ROUND_ROBIN:
        return this.roundRobinSelect(serviceName, healthyInstances);
        
      case LoadBalanceStrategy.WEIGHTED_ROUND_ROBIN:
        return this.weightedRoundRobinSelect(serviceName, healthyInstances);
        
      case LoadBalanceStrategy.LEAST_CONNECTIONS:
        return this.leastConnectionsSelect(healthyInstances);
        
      case LoadBalanceStrategy.CONSISTENT_HASH:
        return this.consistentHashSelect(serviceName, healthyInstances, context?.key);
        
      case LoadBalanceStrategy.IP_HASH:
        return this.ipHashSelect(healthyInstances, context?.ip);
        
      default:
        return this.roundRobinSelect(serviceName, healthyInstances);
    }
  }

  /**
   * 随机算法
   */
  private randomSelect(instances: ServiceInstance[]): ServiceInstance {
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  /**
   * 轮询算法
   */
  private roundRobinSelect(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const currentIndex = this.roundRobinIndices.get(serviceName) || 0;
    const instance = instances[currentIndex];
    
    // 更新索引
    const nextIndex = (currentIndex + 1) % instances.length;
    this.roundRobinIndices.set(serviceName, nextIndex);
    
    return instance;
  }

  /**
   * 加权轮询算法（平滑加权轮询）
   * 参考Nginx的smooth weighted round-robin算法
   */
  private weightedRoundRobinSelect(
    serviceName: string,
    instances: ServiceInstance[],
  ): ServiceInstance {
    // 初始化权重状态
    if (!this.weightedRoundRobinState.has(serviceName)) {
      this.weightedRoundRobinState.set(serviceName, {
        currentWeight: instances.map(() => 0),
        effectiveWeight: instances.map(i => i.weight),
      });
    }
    
    const state = this.weightedRoundRobinState.get(serviceName);
    const { currentWeight, effectiveWeight } = state;
    
    // 计算总权重
    const totalWeight = effectiveWeight.reduce((sum, w) => sum + w, 0);
    
    // 每个实例的当前权重增加其有效权重
    let maxWeightIndex = 0;
    let maxWeight = currentWeight[0] + effectiveWeight[0];
    currentWeight[0] = maxWeight;
    
    for (let i = 1; i < instances.length; i++) {
      currentWeight[i] += effectiveWeight[i];
      if (currentWeight[i] > maxWeight) {
        maxWeight = currentWeight[i];
        maxWeightIndex = i;
      }
    }
    
    // 被选中的实例权重减去总权重
    currentWeight[maxWeightIndex] -= totalWeight;
    
    return instances[maxWeightIndex];
  }

  /**
   * 最少连接算法
   */
  private leastConnectionsSelect(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, current) =>
      current.activeConnections < min.activeConnections ? current : min
    );
  }

  /**
   * 一致性哈希算法
   * 使用虚拟节点提高均衡性
   */
  private consistentHashSelect(
    serviceName: string,
    instances: ServiceInstance[],
    key?: string,
  ): ServiceInstance {
    // 如果没有提供key，使用随机选择
    if (!key) {
      return this.randomSelect(instances);
    }
    
    // 初始化哈希环
    if (!this.consistentHashRings.has(serviceName)) {
      this.buildConsistentHashRing(serviceName, instances);
    }
    
    const ring = this.consistentHashRings.get(serviceName);
    
    // 计算key的哈希值
    const keyHash = this.hash(key);
    
    // 在环上找到第一个大于等于keyHash的节点
    const sortedHashes = Array.from(ring.keys()).sort((a, b) => a - b);
    
    for (const nodeHash of sortedHashes) {
      if (nodeHash >= keyHash) {
        return ring.get(nodeHash);
      }
    }
    
    // 如果没找到，返回第一个节点（环形）
    return ring.get(sortedHashes[0]);
  }

  /**
   * IP哈希算法
   */
  private ipHashSelect(instances: ServiceInstance[], ip?: string): ServiceInstance {
    if (!ip) {
      return this.randomSelect(instances);
    }
    
    const hash = this.hash(ip);
    const index = hash % instances.length;
    return instances[index];
  }

  /**
   * 构建一致性哈希环
   */
  private buildConsistentHashRing(serviceName: string, instances: ServiceInstance[]) {
    const ring = new Map<number, ServiceInstance>();
    
    for (const instance of instances) {
      // 为每个实例创建虚拟节点
      for (let i = 0; i < this.virtualNodesPerInstance; i++) {
        const virtualNodeKey = `${instance.id}-${i}`;
        const hash = this.hash(virtualNodeKey);
        ring.set(hash, instance);
      }
    }
    
    this.consistentHashRings.set(serviceName, ring);
  }

  /**
   * 哈希函数
   */
  private hash(key: string): number {
    const hash = crypto.createHash('md5').update(key).digest();
    // 取前4个字节作为32位整数
    return hash.readUInt32BE(0);
  }

  /**
   * 更新实例列表（用于动态服务发现）
   */
  updateInstances(serviceName: string, instances: ServiceInstance[]) {
    // 重置轮询索引
    this.roundRobinIndices.delete(serviceName);
    
    // 重置加权轮询状态
    this.weightedRoundRobinState.delete(serviceName);
    
    // 重建一致性哈希环
    this.consistentHashRings.delete(serviceName);
    
    this.logger.log(`Updated instances for service ${serviceName}: ${instances.length} instances`);
  }

  /**
   * 标记实例为不健康
   */
  markUnhealthy(serviceName: string, instanceId: string) {
    this.logger.warn(`Marking instance ${instanceId} as unhealthy for service ${serviceName}`);
    // 触发重新构建哈希环等
    this.consistentHashRings.delete(serviceName);
  }

  /**
   * 标记实例为健康
   */
  markHealthy(serviceName: string, instanceId: string) {
    this.logger.log(`Marking instance ${instanceId} as healthy for service ${serviceName}`);
    this.consistentHashRings.delete(serviceName);
  }

  /**
   * 增加实例的活跃连接数
   */
  incrementConnections(instance: ServiceInstance) {
    instance.activeConnections++;
  }

  /**
   * 减少实例的活跃连接数
   */
  decrementConnections(instance: ServiceInstance) {
    if (instance.activeConnections > 0) {
      instance.activeConnections--;
    }
  }
}

