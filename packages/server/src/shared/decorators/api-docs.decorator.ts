import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * API 文档装饰器组合
 * 类似 SpringDoc 的注解组合
 */

/**
 * @ApiDoc - API 文档快捷装饰器
 * 
 * @example
 * ```typescript
 * @ApiDoc({
 *   summary: '获取用户列表',
 *   description: '分页查询用户列表',
 *   auth: true,
 *   responses: {
 *     200: { type: [User], description: '成功' },
 *     401: { description: '未授权' }
 *   }
 * })
 * @Get()
 * findAll() {}
 * ```
 */
export function ApiDoc(options: {
  summary: string;
  description?: string;
  auth?: boolean;
  tags?: string[];
  responses?: Record<number, { type?: any; description: string }>;
}) {
  const decorators = [
    ApiOperation({ 
      summary: options.summary,
      description: options.description 
    }),
  ];

  if (options.auth) {
    decorators.push(ApiBearerAuth('JWT-auth'));
  }

  if (options.tags) {
    decorators.push(ApiTags(...options.tags));
  }

  if (options.responses) {
    Object.entries(options.responses).forEach(([status, config]) => {
      decorators.push(
        ApiResponse({
          status: Number(status),
          description: config.description,
          type: config.type,
        })
      );
    });
  }

  return applyDecorators(...decorators);
}
