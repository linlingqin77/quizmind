import { PrismaService } from './prisma.service';

/**
 * 基础仓储类
 * 提供通用的 CRUD 操作
 */
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  /**
   * 查找所有记录
   */
  async findAll(): Promise<T[]> {
    return this.prisma[this.modelName].findMany();
  }

  /**
   * 根据 ID 查找
   */
  async findById(id: string): Promise<T | null> {
    return this.prisma[this.modelName].findUnique({
      where: { id },
    });
  }

  /**
   * 创建记录
   */
  async create(data: CreateDto): Promise<T> {
    return this.prisma[this.modelName].create({
      data,
    });
  }

  /**
   * 更新记录
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    return this.prisma[this.modelName].update({
      where: { id },
      data,
    });
  }

  /**
   * 删除记录
   */
  async delete(id: string): Promise<T> {
    return this.prisma[this.modelName].delete({
      where: { id },
    });
  }

  /**
   * 计数
   */
  async count(where?: any): Promise<number> {
    return this.prisma[this.modelName].count({ where });
  }

  /**
   * 检查是否存在
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.prisma[this.modelName].count({ where });
    return count > 0;
  }
}

