# 🎨 系统架构图（可视化版本）

> 使用Mermaid绘制的交互式架构图，可在GitHub、GitLab等平台直接渲染

---

## 1. 整体系统架构

```mermaid
graph TB
    subgraph "客户端层"
        iOS[iOS App<br/>React Native]
        Android[Android App<br/>React Native]
        Web[Web Admin<br/>React]
    end
    
    subgraph "API Gateway Layer"
        Gateway[API Gateway<br/>NestJS + tRPC<br/>Port 3000]
        Auth[JWT Auth]
        RateLimit[Rate Limiter]
        Metrics[Metrics Collection]
    end
    
    subgraph "微服务层"
        UserSvc[User Service<br/>:50051]
        ExamSvc[Exam Service<br/>:50052]
        QuestionSvc[Question Service<br/>:50053]
        PaperSvc[Paper Service<br/>:50054]
        AISvc[AI Service<br/>:50055]
        PracticeSvc[Practice Service<br/>:50056]
        AnalyticsSvc[Analytics Service<br/>:50057]
        SocialSvc[Social Service<br/>:50058]
        DocumentSvc[Document Service<br/>:50059]
    end
    
    subgraph "基础设施层"
        Consul[Consul<br/>服务注册]
        Prometheus[Prometheus<br/>指标收集]
        Jaeger[Jaeger<br/>链路追踪]
        ELK[ELK Stack<br/>日志聚合]
    end
    
    subgraph "数据层"
        PostgreSQL[(PostgreSQL<br/>主数据库)]
        Redis[(Redis<br/>缓存/队列)]
        Pinecone[(Pinecone<br/>向量数据库)]
        OSS[OSS/S3<br/>文件存储]
    end
    
    iOS --> Gateway
    Android --> Gateway
    Web --> Gateway
    
    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> Metrics
    
    Gateway -->|gRPC| UserSvc
    Gateway -->|gRPC| ExamSvc
    Gateway -->|gRPC| QuestionSvc
    Gateway -->|gRPC| PaperSvc
    Gateway -->|gRPC| AISvc
    Gateway -->|gRPC| PracticeSvc
    Gateway -->|gRPC| AnalyticsSvc
    Gateway -->|gRPC| SocialSvc
    Gateway -->|gRPC| DocumentSvc
    
    UserSvc --> PostgreSQL
    ExamSvc --> PostgreSQL
    QuestionSvc --> PostgreSQL
    PaperSvc --> PostgreSQL
    AISvc --> PostgreSQL
    PracticeSvc --> PostgreSQL
    AnalyticsSvc --> PostgreSQL
    SocialSvc --> PostgreSQL
    DocumentSvc --> PostgreSQL
    
    UserSvc --> Redis
    ExamSvc --> Redis
    QuestionSvc --> Redis
    
    AISvc --> Pinecone
    DocumentSvc --> OSS
    
    UserSvc -.-> Consul
    ExamSvc -.-> Consul
    QuestionSvc -.-> Consul
    
    UserSvc -.-> Prometheus
    ExamSvc -.-> Prometheus
    
    UserSvc -.-> Jaeger
    ExamSvc -.-> Jaeger
    
    UserSvc -.-> ELK
    ExamSvc -.-> ELK
```

---

## 2. 微服务间调用关系

```mermaid
graph LR
    Gateway[API Gateway]
    
    subgraph "核心服务"
        UserSvc[User Service<br/>认证中心]
        ExamSvc[Exam Service]
        QuestionSvc[Question Service]
    end
    
    subgraph "支持服务"
        PaperSvc[Paper Service]
        AISvc[AI Service]
        PracticeSvc[Practice Service]
        AnalyticsSvc[Analytics Service]
    end
    
    subgraph "扩展服务"
        SocialSvc[Social Service]
        DocumentSvc[Document Service]
    end
    
    Gateway -->|验证Token| UserSvc
    Gateway --> ExamSvc
    Gateway --> QuestionSvc
    
    ExamSvc -->|获取题目| QuestionSvc
    ExamSvc -->|记录统计| AnalyticsSvc
    
    PaperSvc -->|获取题目| QuestionSvc
    
    AISvc -->|解析文档| DocumentSvc
    AISvc -->|创建题目| QuestionSvc
    
    PracticeSvc -->|获取题目| QuestionSvc
    PracticeSvc -->|记录统计| AnalyticsSvc
    
    SocialSvc -->|获取用户信息| UserSvc
    SocialSvc -->|获取成绩| ExamSvc
    
    style UserSvc fill:#ff6b6b
    style ExamSvc fill:#4ecdc4
    style QuestionSvc fill:#45b7d1
```

---

## 3. 数据流图

```mermaid
sequenceDiagram
    participant User as 用户
    participant App as React Native
    participant Gateway as API Gateway
    participant UserSvc as User Service
    participant ExamSvc as Exam Service
    participant QuestionSvc as Question Service
    participant DB as PostgreSQL
    participant Cache as Redis
    
    User->>App: 开始考试
    App->>Gateway: tRPC Request
    Gateway->>UserSvc: 验证Token (gRPC)
    UserSvc->>Gateway: Token Valid
    
    Gateway->>ExamSvc: GetExam (gRPC)
    
    ExamSvc->>Cache: 检查缓存
    alt 缓存命中
        Cache-->>ExamSvc: 返回考试数据
    else 缓存未命中
        ExamSvc->>DB: 查询考试
        DB-->>ExamSvc: 返回数据
        ExamSvc->>Cache: 写入缓存
    end
    
    ExamSvc->>QuestionSvc: GetQuestions (gRPC)
    QuestionSvc->>DB: 查询题目
    DB-->>QuestionSvc: 返回题目
    QuestionSvc-->>ExamSvc: 返回题目列表
    
    ExamSvc-->>Gateway: 返回考试+题目
    Gateway-->>App: tRPC Response
    App-->>User: 显示考试
```

---

## 4. 监控系统架构

```mermaid
graph TB
    subgraph "应用层"
        App1[User Service]
        App2[Exam Service]
        App3[Question Service]
        AppN[Other Services...]
    end
    
    subgraph "指标收集"
        Prometheus[Prometheus<br/>Port 9090]
        NodeExp[Node Exporter<br/>系统指标]
        PgExp[Postgres Exporter<br/>数据库指标]
        RedisExp[Redis Exporter<br/>缓存指标]
    end
    
    subgraph "可视化"
        Grafana[Grafana<br/>Port 3001<br/>Dashboards]
    end
    
    subgraph "告警"
        AlertMgr[Alertmanager<br/>Port 9093]
        Slack[Slack通知]
        Email[邮件通知]
    end
    
    App1 -->|/metrics| Prometheus
    App2 -->|/metrics| Prometheus
    App3 -->|/metrics| Prometheus
    AppN -->|/metrics| Prometheus
    
    NodeExp --> Prometheus
    PgExp --> Prometheus
    RedisExp --> Prometheus
    
    Prometheus --> Grafana
    Prometheus --> AlertMgr
    
    AlertMgr --> Slack
    AlertMgr --> Email
    
    style Prometheus fill:#e85d04
    style Grafana fill:#f48c06
    style AlertMgr fill:#dc2f02
```

---

## 5. 日志聚合架构

```mermaid
graph TB
    subgraph "应用层"
        App[Microservices]
    end
    
    subgraph "日志收集"
        Logstash[Logstash<br/>Port 5000<br/>日志处理]
    end
    
    subgraph "日志存储"
        ES[Elasticsearch<br/>Port 9200<br/>索引存储]
    end
    
    subgraph "日志查询"
        Kibana[Kibana<br/>Port 5601<br/>可视化查询]
    end
    
    App -->|HTTP/TCP| Logstash
    Logstash -->|批量写入| ES
    ES --> Kibana
    
    Logstash -->|解析<br/>过滤<br/>转换| Logstash
    
    style App fill:#023e8a
    style Logstash fill:#0077b6
    style ES fill:#0096c7
    style Kibana fill:#00b4d8
```

---

## 6. 链路追踪架构

```mermaid
graph LR
    subgraph "应用层"
        Gateway[API Gateway]
        UserSvc[User Service]
        ExamSvc[Exam Service]
        QuestionSvc[Question Service]
    end
    
    subgraph "追踪系统"
        Collector[Jaeger Collector<br/>Port 14268]
        Storage[(存储)]
        Query[Jaeger Query<br/>Port 16686]
    end
    
    Gateway -.->|Span| Collector
    UserSvc -.->|Span| Collector
    ExamSvc -.->|Span| Collector
    QuestionSvc -.->|Span| Collector
    
    Collector --> Storage
    Storage --> Query
    
    Query --> UI[Web UI<br/>链路查询]
    
    Gateway -->|TraceId| UserSvc
    UserSvc -->|TraceId| ExamSvc
    ExamSvc -->|TraceId| QuestionSvc
    
    style Collector fill:#9b59b6
    style Query fill:#8e44ad
```

---

## 7. 部署架构（Docker Compose）

```mermaid
graph TB
    subgraph "Monitoring Stack"
        Consul[Consul<br/>:8500]
        Prom[Prometheus<br/>:9090]
        Grafana[Grafana<br/>:3001]
        Jaeger[Jaeger<br/>:16686]
        ES[Elasticsearch<br/>:9200]
        Logstash[Logstash<br/>:5000]
        Kibana[Kibana<br/>:5601]
    end
    
    subgraph "Application Stack"
        Gateway[API Gateway<br/>:3000]
        UserSvc[User Service<br/>:50051]
        ExamSvc[Exam Service<br/>:50052]
        QuestionSvc[Question Service<br/>:50053]
        OtherSvcs[Other Services<br/>:50054-50059]
    end
    
    subgraph "Data Stack"
        PG[(PostgreSQL<br/>:5432)]
        Redis[(Redis<br/>:6379)]
    end
    
    subgraph "External"
        Client[Client Apps]
    end
    
    Client --> Gateway
    
    Gateway --> UserSvc
    Gateway --> ExamSvc
    Gateway --> QuestionSvc
    Gateway --> OtherSvcs
    
    UserSvc --> PG
    ExamSvc --> PG
    QuestionSvc --> PG
    
    UserSvc --> Redis
    ExamSvc --> Redis
    
    UserSvc -.-> Consul
    UserSvc -.-> Prom
    UserSvc -.-> Jaeger
    UserSvc -.-> Logstash
    
    Logstash --> ES
    ES --> Kibana
    Prom --> Grafana
```

---

## 8. 负载均衡策略

```mermaid
graph TB
    Client[客户端请求]
    
    subgraph "负载均衡器"
        LB[LoadBalancer Service]
        
        subgraph "策略选择"
            Random[随机]
            RoundRobin[轮询]
            Weighted[加权轮询]
            LeastConn[最少连接]
            ConsistentHash[一致性哈希]
            IPHash[IP哈希]
        end
    end
    
    subgraph "服务实例"
        Instance1[Instance 1<br/>权重: 5]
        Instance2[Instance 2<br/>权重: 3]
        Instance3[Instance 3<br/>权重: 2]
    end
    
    Client --> LB
    
    LB --> Random
    LB --> RoundRobin
    LB --> Weighted
    LB --> LeastConn
    LB --> ConsistentHash
    LB --> IPHash
    
    Random -.-> Instance1
    Random -.-> Instance2
    Random -.-> Instance3
    
    RoundRobin -.->|平均分配| Instance1
    RoundRobin -.->|平均分配| Instance2
    RoundRobin -.->|平均分配| Instance3
    
    Weighted -.->|50%| Instance1
    Weighted -.->|30%| Instance2
    Weighted -.->|20%| Instance3
```

---

## 9. AI服务工作流

```mermaid
graph TB
    User[用户上传文档]
    
    subgraph "Document Service"
        Upload[文件上传]
        OCR[OCR识别]
        Parse[文档解析]
    end
    
    subgraph "AI Service"
        DeepSeek[DeepSeek API]
        Extract[知识点提取]
        Generate[生成题目]
        Grade[批改题目]
    end
    
    subgraph "Question Service"
        Store[题目存储]
        Category[分类管理]
    end
    
    subgraph "Vector DB"
        Pinecone[Pinecone<br/>向量搜索]
    end
    
    User --> Upload
    Upload --> OCR
    OCR --> Parse
    Parse --> Extract
    
    Extract --> DeepSeek
    DeepSeek --> Generate
    Generate --> Store
    Store --> Category
    
    Extract -.->|嵌入| Pinecone
    Generate -.->|相似度检索| Pinecone
    
    Grade --> DeepSeek
    
    style DeepSeek fill:#00d2ff
    style Pinecone fill:#7209b7
```

---

## 10. 练习模式架构

```mermaid
graph TB
    Student[学员]
    
    subgraph "Practice Service"
        Mode1[模式1: 章节练习]
        Mode2[模式2: 随机练习]
        Mode3[模式3: 错题练习]
        Mode4[模式4: 收藏练习]
        Mode5[模式5: 真题模拟]
        Mode6[模式6: 智能练习]
    end
    
    subgraph "Question Service"
        Filter[题目筛选]
        Random[随机抽取]
    end
    
    subgraph "错题本"
        WrongQs[(错题记录)]
        Favorites[(收藏题目)]
    end
    
    subgraph "Analytics Service"
        Stats[统计分析]
        Report[学习报告]
        Curve[学习曲线]
    end
    
    Student --> Mode1
    Student --> Mode2
    Student --> Mode3
    Student --> Mode4
    Student --> Mode5
    Student --> Mode6
    
    Mode1 --> Filter
    Mode2 --> Random
    Mode3 --> WrongQs
    Mode4 --> Favorites
    Mode5 --> Filter
    Mode6 --> Filter
    
    Mode6 -.->|AI推荐| Stats
    
    Filter --> Random
    Random --> Student
    
    Student -->|提交答案| Stats
    Stats --> Report
    Stats --> Curve
    Stats --> WrongQs
```

---

## 使用说明

### 在GitHub/GitLab中查看

这些Mermaid图表会在GitHub和GitLab中自动渲染为交互式图表。

### 在本地编辑器中查看

推荐使用以下工具：
- **VS Code** + Mermaid Preview插件
- **Typora**（支持原生Mermaid）
- **在线编辑器**：https://mermaid.live/

### 导出图片

访问 https://mermaid.live/，粘贴代码，导出为PNG/SVG。

---

**架构图版本：** V1.0  
**最后更新：** 2025-10-14  
**绘制工具：** Mermaid


