import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * 注册
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
  }) {
    const user = await this.usersService.createUser({
      ...data,
      role: Role.STUDENT, // 默认注册为学员
    });

    const token = this.generateToken(user);

    return {
      user,
      token,
    };
  }

  /**
   * 登录
   */
  async login(identifier: string, password: string) {
    // 支持邮箱或用户名登录
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isValidPassword = await this.usersService.validatePassword(
      user,
      password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查账号是否被禁用
    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 更新最后登录时间
    await this.usersService.updateLastLogin(user.id);

    // 生成token
    const token = this.generateToken(user);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 验证Token
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      return user;
    } catch (error) {
      throw new UnauthorizedException('无效的token');
    }
  }

  /**
   * 刷新Token
   */
  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    const token = this.generateToken(user);
    return { token };
  }

  /**
   * 生成JWT Token
   */
  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}

