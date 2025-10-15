import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/base.repository';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from './user.repository.interface';

/**
 * 用户仓储实现
 * 负责用户数据的持久化操作
 */
@Injectable()
export class UserRepository
  extends BaseRepository<User, CreateUserData, UpdateUserData>
  implements IUserRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}

