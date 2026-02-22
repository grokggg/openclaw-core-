#!/usr/bin/env node

/**
 * OpenClaw AI Orchestrator v2.0
 * 现代化、模块化、企业级的AI工作流编排平台
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// 创建简单的日志函数
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta)
};
// 环境配置
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3002,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  API_KEY: process.env.API_KEY || 'your-secure-api-key-here-change-in-production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  PERFORMANCE: {
    MAX_PAYLOAD_SIZE: '10mb',
    COMPRESSION_LEVEL: 6
  },
  SECURITY: {
    RATE_LIMIT_WINDOW_MS: 900000, // 15分钟
    RATE_LIMIT_MAX_REQUESTS: 100
  }
};
// 初始化Express应用
const app = express();

// ==================== 中间件配置 ====================
// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS配置
app.use(cors({
  origin: env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// 请求解析
app.use(express.json({ limit: env.PERFORMANCE.MAX_PAYLOAD_SIZE }));
app.use(express.urlencoded({ extended: true }));

// 压缩
app.use(compression({ level: env.PERFORMANCE.COMPRESSION_LEVEL }));
// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: env.SECURITY.RATE_LIMIT_WINDOW_MS,
  max: env.SECURITY.RATE_LIMIT_MAX_REQUESTS,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用速率限制
app.use('/api/', limiter);
// ==================== API路由 ====================
// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OpenClaw AI Orchestrator',
    version: '2.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
  });
});

// API版本前缀
const API_PREFIX = '/api/v1';
// 模拟数据
const mockSessions = [
  { id: 'sess_001', type: 'product_launch', status: 'completed', createdAt: new Date(Date.now() - 3600000) },
  { id: 'sess_002', type: 'content_campaign', status: 'running', createdAt: new Date(Date.now() - 1800000) },
  { id: 'sess_003', type: 'customer_support', status: 'pending', createdAt: new Date(Date.now() - 900000) },
  { id: 'sess_004', type: 'data_analysis', status: 'completed', createdAt: new Date(Date.now() - 450000) },
  { id: 'sess_005', type: 'market_research', status: 'failed', createdAt: new Date(Date.now() - 300000) }
];

const mockWorkflows = [
  { id: 'product_launch', name: '产品发布', description: '完整的AI产品发布流程' },
  { id: 'content_campaign', name: '内容营销', description: '多平台内容营销活动' },
  { id: 'customer_support', name: '客户支持', description: '智能客户支持流程' },
  { id: 'data_analysis', name: '数据分析', description: '深度数据分析与洞察' },
  { id: 'market_research', name: '市场调研', description: '自动市场调研与分析' }
];
// 会话列表API
app.get(`${API_PREFIX}/sessions`, (req, res) => {
  const { limit = 10, sortOrder = 'desc' } = req.query;
  let sessions = [...mockSessions];
  
  if (sortOrder === 'desc') {
    sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    sessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  
  res.json({
    success: true,
    data: {
      sessions: sessions.slice(0, parseInt(limit)),
      total: sessions.length,
      page: 1,
      limit: parseInt(limit)
    }
  });
});
// 系统统计API
app.get(`${API_PREFIX}/stats`, (req, res) => {
  const stats = {
    totalCreated: mockSessions.length,
    byStatus: {
      running: mockSessions.filter(s => s.status === 'running').length,
      completed: mockSessions.filter(s => s.status === 'completed').length,
      pending: mockSessions.filter(s => s.status === 'pending').length,
      failed: mockSessions.filter(s => s.status === 'failed').length
    },
    byType: {
      product_launch: mockSessions.filter(s => s.type === 'product_launch').length,
      content_campaign: mockSessions.filter(s => s.type === 'content_campaign').length,
      customer_support: mockSessions.filter(s => s.type === 'customer_support').length,
      data_analysis: mockSessions.filter(s => s.type === 'data_analysis').length,
      market_research: mockSessions.filter(s => s.type === 'market_research').length
    },
    performance: {
      avgResponseTime: 145,
      successRate: 87.5,
      uptime: 99.9
    }
  };
  
  res.json({
    success: true,
    data: stats
  });
});
// 工作流类型API
app.get(`${API_PREFIX}/workflows/types`, (req, res) => {
  res.json({
    success: true,
    data: mockWorkflows
  });
});

// 启动工作流API
app.post(`${API_PREFIX}/workflows/start`, (req, res) => {
  const { workflowType, data = {} } = req.body;
  
  if (!workflowType) {
    return res.status(400).json({
      success: false,
      error: '必须指定工作流类型'
    });
  }
  
  const workflow = mockWorkflows.find(w => w.id === workflowType);
  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: '工作流类型不存在'
    });
  }
  
  const newSession = {
    id: `sess_${Date.now().toString(36).toUpperCase()}`,
    type: workflowType,
    status: 'running',
    data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockSessions.unshift(newSession);
  
  res.json({
    success: true,
    data: {
      message: '工作流启动成功',
      session: newSession
    }
  });
});
// 前端静态文件
app.use(express.static(path.join(__dirname, 'frontend')));

// 默认路由 - 前端应用
app.get('*', (req, res) => {
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false,
      error: 'API端点不存在',
      path: req.path
    });
  }
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
// ==================== 错误处理 ====================
// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '资源不存在',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('未捕获的错误', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    error: env.NODE_ENV === 'production' ? '内部服务器错误' : err.message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
});
// ==================== 服务器启动 ====================
const startServer = async () => {
  try {
    // 确保必要的目录存在
    ['storage/logs', 'storage/sessions', 'storage/templates'].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      const { address, port } = server.address();
      logger.info(`🚀 OpenClaw AI Orchestrator 启动成功`, {
        environment: env.NODE_ENV,
        port,
        address,
        pid: process.pid,
        timestamp: new Date().toISOString(),
      });
      // 控制台输出
      console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  🎉 OpenClaw AI Orchestrator v2.0 启动成功!                        ║
║                                                                      ║
║  📊 访问地址: http://localhost:${port}                               ║
║  🩺 健康检查: http://localhost:${port}/health                        ║
║  📚 API 文档: http://localhost:${port}/api/v1                       ║
║                                                                      ║
║  📁 工作流类型:                                                    ║
║     • 🚀 产品发布  • 📢 内容营销                                   ║
║     • 🤝 客户支持  • 📊 数据分析                                   ║
║     • 🔍 市场调研                                                   ║
║                                                                      ║
║  ⏰ ${new Date().toLocaleString('zh-CN')}                             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
      `);
    });
    // 优雅关闭
    const gracefulShutdown = (signal) => {
      logger.info(`接收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(() => {
        logger.info('HTTP服务器已关闭');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon重启

    // 未处理异常捕获
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝', { reason: reason.toString(), promise });
    });

  } catch (error) {
    logger.error('服务器启动失败', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};
// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;
