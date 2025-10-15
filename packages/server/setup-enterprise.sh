#!/bin/bash

# 企业级功能安装脚本
# 自动安装所有必需的依赖包

echo "🚀 开始安装企业级功能依赖..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 进入后端目录
cd "$(dirname "$0")"

echo -e "${BLUE}📦 安装核心依赖...${NC}"

# 日志系统
echo "  - Winston (日志系统)"
pnpm add winston winston-daily-rotate-file

# 配置验证
echo "  - Joi (配置验证)"
pnpm add joi

# 缓存系统
echo "  - Redis (缓存)"
pnpm add @nestjs/cache-manager cache-manager cache-manager-redis-store redis

# 安全
echo "  - 安全中间件"
pnpm add @nestjs/throttler helmet compression

# 监控
echo "  - Sentry (错误监控)"
pnpm add @sentry/node @sentry/tracing

# 工具库
echo "  - 工具库"
pnpm add uuid

# 开发依赖
echo "  - 开发依赖"
pnpm add -D @types/compression @types/uuid

echo ""
echo -e "${GREEN}✅ 核心依赖安装完成${NC}"
echo ""

# 可选依赖
read -p "是否安装可选依赖（邮件、消息队列等）? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${BLUE}📦 安装可选依赖...${NC}"
    
    # 邮件服务
    echo "  - 邮件服务"
    pnpm add @nestjs-modules/mailer nodemailer handlebars
    pnpm add -D @types/nodemailer
    
    # 消息队列
    echo "  - Bull (消息队列)"
    pnpm add @nestjs/bull bull
    pnpm add -D @types/bull
    
    # 定时任务
    echo "  - Schedule (定时任务)"
    pnpm add @nestjs/schedule
    
    # 文件上传
    echo "  - 文件上传"
    pnpm add multer sharp
    pnpm add -D @types/multer
    
    echo ""
    echo -e "${GREEN}✅ 可选依赖安装完成${NC}"
fi

echo ""
echo -e "${BLUE}🔧 配置环境变量...${NC}"

# 检查 .env 文件
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ 已创建 .env 文件${NC}"
    echo -e "${YELLOW}⚠️  请编辑 .env 文件，配置必要的环境变量${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件已存在，跳过创建${NC}"
fi

echo ""
echo -e "${BLUE}📁 创建必要的目录...${NC}"

# 创建日志目录
mkdir -p logs
mkdir -p uploads
mkdir -p temp

echo -e "${GREEN}✅ 目录创建完成${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 企业级功能安装完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "已安装的功能："
echo "  ✅ 结构化日志系统（Winston）"
echo "  ✅ Redis 缓存"
echo "  ✅ 限流保护"
echo "  ✅ 错误监控（Sentry）"
echo "  ✅ 配置验证（Joi）"
echo "  ✅ 安全增强（Helmet）"
echo "  ✅ 响应压缩"
echo ""
echo "下一步："
echo "  1. 配置 .env 文件中的环境变量"
echo "  2. 启动 Redis (如果使用缓存)"
echo "  3. 运行 pnpm start:dev"
echo ""
echo "参考文档："
echo "  - ENTERPRISE_FEATURES.md - 企业级功能文档"
echo "  - README.md - 快速开始指南"
echo ""

