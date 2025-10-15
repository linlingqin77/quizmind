import * as Joi from 'joi';

/**
 * 环境变量验证 Schema
 * 确保所有必需的环境变量都已正确配置
 */
export const envValidationSchema = Joi.object({
  // 应用配置
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  
  // 数据库
  DATABASE_URL: Joi.string().required(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: Joi.string().required(),
  
  // Redis (可选)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),
  
  // AI 服务
  DEEPSEEK_API_KEY: Joi.string().optional(),
  DEEPSEEK_BASE_URL: Joi.string().uri().optional(),
  
  // 向量数据库
  PINECONE_API_KEY: Joi.string().optional(),
  PINECONE_ENVIRONMENT: Joi.string().optional(),
  PINECONE_INDEX_NAME: Joi.string().optional(),
  
  // 文件上传
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_DIR: Joi.string().default('./uploads'),
  STORAGE_TYPE: Joi.string().valid('local', 'oss', 's3').default('local'),
  
  // 邮件服务
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().optional(),
  
  // 日志
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug')
    .default('info'),
  LOG_FILE_PATH: Joi.string().default('./logs'),
  
  // 限流
  RATE_LIMIT_TTL: Joi.number().default(60000), // 1分钟
  RATE_LIMIT_MAX: Joi.number().default(100),
  
  // Sentry
  SENTRY_DSN: Joi.string().uri().optional(),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  
  // 会话
  SESSION_SECRET: Joi.string().min(32).optional(),
  SESSION_MAX_AGE: Joi.number().default(86400000), // 24小时
});

/**
 * 验证环境变量
 */
export function validateEnv(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`环境变量验证失败: ${errors}`);
  }

  return value;
}

