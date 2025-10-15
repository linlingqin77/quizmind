# 🔍 监控系统使用指南

## 快速开始

### 1. 启动监控栈（30秒）

```bash
# 给脚本执行权限
chmod +x scripts/start-monitoring.sh scripts/stop-monitoring.sh

# 启动所有监控服务
./scripts/start-monitoring.sh
```

### 2. 访问监控面板

| 服务 | URL | 用户名/密码 | 说明 |
|------|-----|------------|------|
| **Grafana** | http://localhost:3001 | admin/admin | 可视化监控面板 |
| **Prometheus** | http://localhost:9090 | - | 指标查询 |
| **Jaeger** | http://localhost:16686 | - | 链路追踪 |
| **Kibana** | http://localhost:5601 | - | 日志查询 |
| **Consul** | http://localhost:8500 | - | 服务注册 |
| **Redis Commander** | http://localhost:8081 | - | Redis管理 |
| **pgAdmin** | http://localhost:5050 | admin@admin.com/admin | PostgreSQL管理 |

---

## 📊 Prometheus 指标

### 已集成的指标

#### HTTP指标
```promql
# 请求总数
http_requests_total{service="user-service"}

# 请求响应时间（95分位）
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])
```

#### gRPC指标
```promql
# gRPC调用总数
grpc_calls_total{service="ai-service"}

# gRPC错误率
rate(grpc_call_errors_total[5m]) / rate(grpc_calls_total[5m])

# gRPC响应时间
histogram_quantile(0.95, rate(grpc_call_duration_seconds_bucket[5m]))
```

#### 数据库指标
```promql
# 数据库查询总数
db_queries_total

# 数据库查询时间
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))

# 连接池状态
db_connection_pool_size{state="active"}
```

#### 缓存指标
```promql
# 缓存命中率
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

#### AI服务指标
```promql
# AI请求总数
ai_requests_total{provider="deepseek"}

# AI Token使用量
ai_tokens_used_total{model="deepseek-chat"}

# AI请求耗时
histogram_quantile(0.95, rate(ai_request_duration_seconds_bucket[5m]))
```

---

## 📈 Grafana Dashboard

### 导入预定义Dashboard

1. 访问 http://localhost:3001
2. 登录（admin/admin）
3. 点击 "+" → "Import"
4. 输入Dashboard ID或上传JSON

### 推荐的Dashboard

| Dashboard | ID | 说明 |
|-----------|-------|------|
| Node Exporter Full | 1860 | 系统监控 |
| Redis | 763 | Redis监控 |
| PostgreSQL | 9628 | PostgreSQL监控 |

### 自定义Dashboard

创建 `grafana/dashboards/json/custom.json`：

```json
{
  "dashboard": {
    "title": "AI Quiz System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      }
    ]
  }
}
```

---

## 🔍 Jaeger 链路追踪

### 查看链路

1. 访问 http://localhost:16686
2. 选择服务（如：user-service）
3. 点击 "Find Traces"
4. 查看完整的请求链路

### TraceId 关联

在日志中搜索 TraceId，可以关联到具体的请求链路：

```typescript
// 代码中获取TraceId
const traceId = tracer.getCurrentTraceId();
logger.log(`Processing request [${traceId}]`);
```

---

## 📋 Kibana 日志查询

### 基础查询

```
# 查询特定服务的日志
service: "user-service"

# 查询错误日志
level: "ERROR"

# 查询包含TraceId的日志
traceId: "abc123def456"

# 组合查询
service: "ai-service" AND level: "ERROR"
```

### 创建索引模式

1. 访问 http://localhost:5601
2. Management → Stack Management → Index Patterns
3. 创建模式：`logs-*`
4. 选择时间字段：`timestamp`

### 查看日志

1. Discover → 选择索引模式
2. 设置时间范围
3. 添加过滤条件
4. 保存查询

---

## ⚠️ 告警规则

### 已配置的告警

查看 `prometheus/alerts/service_alerts.yml`：

1. **ServiceDown** - 服务不可用
2. **HighErrorRate** - 高错误率（>5%）
3. **HighResponseTime** - 高响应时间（>1s）
4. **HighGrpcErrorRate** - gRPC高错误率
5. **DatabaseConnectionPoolLow** - 数据库连接池不足
6. **RedisDown** - Redis不可用
7. **AIServiceHighLatency** - AI服务高延迟
8. **QueueBacklog** - 队列积压

### 配置告警通知

编辑 `alertmanager/config.yml`：

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - channel: '#alerts'
        api_url: 'YOUR_SLACK_WEBHOOK_URL'
```

---

## 🛠️ 应用集成

### 1. 安装依赖

```bash
npm install prom-client @elastic/elasticsearch
```

### 2. 在应用中集成

```typescript
// app.module.ts
import { PrometheusMetricsModule } from './common/monitoring/prometheus-metrics.module';
import { LoggingModule } from './common/logging/logging.module';

@Module({
  imports: [
    PrometheusMetricsModule,
    LoggingModule,
    // ... 其他模块
  ],
})
export class AppModule {}
```

### 3. 暴露指标端点

```typescript
// main.ts
import { MetricsController } from './common/monitoring/metrics.controller';

// 添加指标端点
app.use('/metrics', async (req, res) => {
  const metrics = await metricsService.getMetrics();
  res.set('Content-Type', metricsService.getContentType());
  res.send(metrics);
});
```

### 4. 使用拦截器自动收集指标

```typescript
// app.module.ts
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
```

---

## 📊 常用查询示例

### Prometheus

```promql
# 服务QPS
rate(http_requests_total[1m])

# 平均响应时间
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# CPU使用率
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

### Elasticsearch/Kibana

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "service": "user-service" } },
        { "match": { "level": "ERROR" } }
      ],
      "filter": [
        {
          "range": {
            "timestamp": {
              "gte": "now-1h"
            }
          }
        }
      ]
    }
  }
}
```

---

## 🔧 故障排查

### 服务启动失败

```bash
# 查看日志
docker-compose -f docker-compose.monitoring.yml logs -f [service_name]

# 重启服务
docker-compose -f docker-compose.monitoring.yml restart [service_name]
```

### Elasticsearch内存不足

编辑 `docker-compose.monitoring.yml`：

```yaml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms1g -Xmx1g"  # 增加内存
```

### Prometheus数据保留

```yaml
prometheus:
  command:
    - '--storage.tsdb.retention.time=30d'  # 保留30天
```

---

## 📚 更多资源

- [Prometheus文档](https://prometheus.io/docs/)
- [Grafana文档](https://grafana.com/docs/)
- [Jaeger文档](https://www.jaegertracing.io/docs/)
- [ELK Stack文档](https://www.elastic.co/guide/)

---

## ✅ 检查清单

监控系统部署完成后，确认以下内容：

- [ ] 所有服务正常运行
- [ ] Prometheus能抓取所有服务指标
- [ ] Grafana能显示Dashboard
- [ ] Jaeger能看到链路追踪
- [ ] Kibana能查询到日志
- [ ] 告警规则正常工作
- [ ] 应用集成了指标收集
- [ ] 应用集成了日志发送

---

**监控系统就绪！现在你可以全面监控AI Quiz System的运行状态了。** 🎉

