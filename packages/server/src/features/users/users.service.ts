import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建用户
   */
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    role?: Role;
  }) {
    // 检查邮箱是否已存在
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new ConflictException('用户名已被使用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: (typeof data.role === 'string' ? data.role : 'STUDENT') as any,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        nickname: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * 通过邮箱查找用户
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 通过用户名查找用户
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * 通过ID查找用户
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        nickname: true,
        phone: true,
        bio: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 验证密码
   */
  async validatePassword(user: any, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, data: {
    nickname?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        nickname: true,
        phone: true,
        bio: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证旧密码
    const isValidPassword = await this.validatePassword(user, oldPassword);
    if (!isValidPassword) {
      throw new ConflictException('旧密码不正确');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '密码修改成功' };
  }
}

