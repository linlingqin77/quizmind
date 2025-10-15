#!/bin/bash

# 停止监控栈脚本

set -e

echo "🛑 Stopping Monitoring Stack..."
echo ""

docker-compose -f docker-compose.monitoring.yml down

echo ""
echo "✅ Monitoring Stack Stopped"
echo ""
echo "💡 To remove all data volumes, run:"
echo "   docker-compose -f docker-compose.monitoring.yml down -v"
echo ""

