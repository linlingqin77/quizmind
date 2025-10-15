import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

/**
 * tRPC 初始化
 */
const t = initTRPC.context<Context>().create();

/**
 * 导出基础构建块
 */
export const router = t.router;
export const middleware = t.middleware;

/**
 * 公共路由（无需认证）
 */
export const publicProcedure = t.procedure;

/**
 * 受保护的路由（需要认证）
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '请先登录',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * 老师权限路由
 */
export const teacherProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'TEACHER' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '仅老师和管理员可访问',
    });
  }

  return next({ ctx });
});

/**
 * 管理员权限路由
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '仅管理员可访问',
    });
  }

  return next({ ctx });
});

