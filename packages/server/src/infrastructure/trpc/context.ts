import { Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../features/users/users.service';

export type Context = {
  user?: any;
  req: trpcExpress.CreateExpressContextOptions['req'];
  res: trpcExpress.CreateExpressContextOptions['res'];
};

@Injectable()
export class TRPCContext {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async create(
    opts: trpcExpress.CreateExpressContextOptions,
  ): Promise<Context> {
    const { req, res } = opts;

    // 从header中提取token
    const token = req.headers.authorization?.replace('Bearer ', '');

    let user = null;
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        user = await this.usersService.findById(payload.sub);
      } catch (error) {
        // Token无效，user保持为null
      }
    }

    return {
      req,
      res,
      user,
    };
  }
}

