/**
 * 错误处理工具函数
 * 用于处理 TypeScript 严格模式下的 catch 块错误类型
 */

/**
 * 从unknown类型的错误中安全地获取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error';
}

/**
 * 从unknown类型的错误中安全地获取错误堆栈
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  if (error && typeof error === 'object' && 'stack' in error) {
    return String(error.stack);
  }
  return undefined;
}

/**
 * 判断是否为Error对象
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

