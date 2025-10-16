import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../repositories/user.repository.interface';

/**
 * 认证服务
 * 处理用户注册、登录、Token 生成等业务逻辑
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
  }): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // 1. 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 2. 检查用户名是否已存在
    const existingUsername = await this.userRepository.findByUsername(
      data.username,
    );
    if (existingUsername) {
      throw new ConflictException('该用户名已被使用');
    }

    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. 创建用户
    const user = await this.userRepository.create({
      email: data.email,
      username: data.username,
      password: hashedPassword,
      role: 'STUDENT', // 默认角色为学员
    });

    // 5. 生成 Token
    const token = this.generateToken(user);

    // 6. 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 用户登录
   */
  async login(
    identifier: string,
    password: string,
  ): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // 1. 查找用户（支持邮箱或用户名登录）
    const user = identifier.includes('@')
      ? await this.userRepository.findByEmail(identifier)
      : await this.userRepository.findByUsername(identifier);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 3. 检查账号状态
    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 4. 更新最后登录时间
    await this.userRepository.updateLastLogin(user.id);

    // 5. 生成 Token
    const token = this.generateToken(user);

    // 6. 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 刷新 Token
   */
  async refreshToken(userId: string): Promise<{ token: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    const token = this.generateToken(user);
    return { token };
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    // 1. 获取用户
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 2. 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('旧密码错误');
    }

    // 3. 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. 更新密码
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}

