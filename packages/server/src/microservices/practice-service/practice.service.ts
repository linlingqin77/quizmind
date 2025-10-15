import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: 实现练习服务的业务逻辑
  // 包括：6种练习模式、背题模式、错题本、收藏夹、练习记录等
}

