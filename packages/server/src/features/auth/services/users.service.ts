import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { User } from '@prisma/client';
import { IUserRepository } from '../repositories/user.repository.interface';

/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * 根据 ID 获取用户
   */
  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 更新用户信息
   */
  async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      avatar?: string;
      phone?: string;
      bio?: string;
    },
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.update(userId, data);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 获取所有用户（管理员功能）
   */
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll();
    return users.map(({ password, ...user }) => user);
  }
}

