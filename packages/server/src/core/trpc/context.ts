import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

/**
 * tRPC 上下文接口
 */
export interface Context {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user?: User;
}

/**
 * tRPC 上下文创建服务
 */
@Injectable()
export class TRPCContext {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 创建请求上下文
   */
  async create({ req, res }: CreateExpressContextOptions): Promise<Context> {
    // 从 header 中提取 token
    const token = this.extractTokenFromHeader(req);
    
    let user: User | undefined;

    if (token) {
      try {
        // 验证 token
        const payload = this.jwtService.verify(token);
        
        // 获取用户信息
        const foundUser = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (foundUser && foundUser.isActive) {
          user = foundUser;
        }
      } catch (error) {
        // Token 无效或过期，不抛出错误，让中间件处理
        console.warn('Token 验证失败:', error.message);
      }
    }

    return {
      req,
      res,
      user,
    };
  }

  /**
   * 从请求头中提取 token
   */
  private extractTokenFromHeader(req: any): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

