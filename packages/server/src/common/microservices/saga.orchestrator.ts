import { Injectable, Logger } from '@nestjs/common';

interface SagaStep<T = any> {
  execute: () => Promise<T>;
  compensate: (result?: T) => Promise<void>;
  result?: T;
}

/**
 * Saga 编排器
 * 用于处理分布式事务
 */
@Injectable()
export class SagaOrchestrator {
  private readonly logger = new Logger(SagaOrchestrator.name);
  private steps: SagaStep[] = [];

  /**
   * 添加 Saga 步骤
   */
  addStep<T>(
    execute: () => Promise<T>,
    compensate: (result?: T) => Promise<void>,
  ): this {
    this.steps.push({ execute, compensate });
    return this;
  }

  /**
   * 执行 Saga
   */
  async execute(): Promise<any[]> {
    const results: any[] = [];
    let currentStep = 0;

    try {
      // 依次执行所有步骤
      for (const step of this.steps) {
        this.logger.log(`Executing step ${currentStep + 1}/${this.steps.length}`);
        const result = await step.execute();
        step.result = result;
        results.push(result);
        currentStep++;
      }

      this.logger.log('Saga completed successfully');
      return results;
    } catch (error) {
      this.logger.error(`Saga failed at step ${currentStep + 1}: ${error.message}`);

      // 回滚已执行的步骤
      await this.compensate(currentStep);

      throw error;
    }
  }

  /**
   * 补偿（回滚）
   */
  private async compensate(failedStep: number): Promise<void> {
    this.logger.warn('Starting compensation...');

    // 逆序补偿已执行的步骤
    for (let i = failedStep - 1; i >= 0; i--) {
      const step = this.steps[i];
      try {
        this.logger.log(`Compensating step ${i + 1}`);
        await step.compensate(step.result);
      } catch (error) {
        this.logger.error(`Compensation failed for step ${i + 1}: ${error.message}`);
        // 继续补偿其他步骤
      }
    }

    this.logger.log('Compensation completed');
  }

  /**
   * 清理步骤
   */
  clear(): void {
    this.steps = [];
  }
}

/**
 * Saga 工厂
 * 便于创建新的 Saga 实例
 */
@Injectable()
export class SagaFactory {
  createSaga(): SagaOrchestrator {
    return new SagaOrchestrator();
  }
}

/**
 * 使用示例:
 * 
 * @Injectable()
 * export class OrderService {
 *   constructor(private sagaFactory: SagaFactory) {}
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     const saga = this.sagaFactory.createSaga();
 * 
 *     saga
 *       .addStep(
 *         // 步骤1: 创建订单
 *         async () => {
 *           return this.orderRepository.create(dto);
 *         },
 *         async (order) => {
 *           await this.orderRepository.delete(order.id);
 *         }
 *       )
 *       .addStep(
 *         // 步骤2: 扣减库存
 *         async () => {
 *           return this.inventoryService.deduct(dto.items);
 *         },
 *         async () => {
 *           await this.inventoryService.restore(dto.items);
 *         }
 *       )
 *       .addStep(
 *         // 步骤3: 创建支付
 *         async () => {
 *           return this.paymentService.create(dto.amount);
 *         },
 *         async (payment) => {
 *           await this.paymentService.cancel(payment.id);
 *         }
 *       );
 * 
 *     return saga.execute();
 *   }
 * }
 */
