#!/bin/bash

# 启动监控栈脚本

set -e

echo "🚀 Starting Monitoring Stack for AI Quiz System..."
echo ""

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# 创建必要的目录
echo "📁 Creating required directories..."
mkdir -p grafana/dashboards/json
mkdir -p prometheus/alerts
mkdir -p logstash/pipeline
mkdir -p logstash/config
mkdir -p alertmanager

echo "✅ Directories created"
echo ""

# 启动监控栈
echo "🐳 Starting monitoring containers..."
docker-compose -f docker-compose.monitoring.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# 检查服务状态
echo ""
echo "🔍 Checking service health..."
echo ""

services=("consul" "prometheus" "grafana" "elasticsearch" "kibana" "jaeger" "postgres" "redis")

for service in "${services[@]}"; do
  if docker ps | grep -q $service; then
    echo "✅ $service is running"
  else
    echo "❌ $service failed to start"
  fi
done

echo ""
echo "🎉 Monitoring Stack Started Successfully!"
echo ""
echo "📊 Access URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔵 Consul:          http://localhost:8500"
echo "📈 Prometheus:      http://localhost:9090"
echo "📊 Grafana:         http://localhost:3001 (admin/admin)"
echo "🔍 Jaeger:          http://localhost:16686"
echo "📋 Kibana:          http://localhost:5601"
echo "🔴 Redis Commander: http://localhost:8081"
echo "🐘 pgAdmin:         http://localhost:5050 (admin@admin.com/admin)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "  - View logs: docker-compose -f docker-compose.monitoring.yml logs -f"
echo "  - Stop stack: docker-compose -f docker-compose.monitoring.yml down"
echo "  - Remove volumes: docker-compose -f docker-compose.monitoring.yml down -v"
echo ""

