import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Swagger API 文档配置
 * 类似 SpringDoc 的自动文档生成
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AI Quiz System API')
    .setDescription('企业级智能题库学习系统 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', '认证授权')
    .addTag('users', '用户管理')
    .addTag('exams', '考试管理')
    .addTag('questions', '题目管理')
    .addTag('permissions', '权限管理')
    .addTag('audit', '审计日志')
    .addTag('files', '文件管理')
    .addTag('email', '邮件服务')
    .addTag('queue', '任务队列')
    .addTag('health', '健康检查')
    .addTag('metrics', '应用指标')
    .addServer('http://localhost:3001', '本地开发环境')
    .addServer('https://api.example.com', '生产环境')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'AI Quiz System API',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { font-size: 36px }
    `,
  });

  console.log('📚 Swagger文档已启动: http://localhost:3001/api/docs');
}
