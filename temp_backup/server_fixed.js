const express = require('express');
const app = express();
const PORT = 3002;

// 中间件
app.use(express.json());
app.use(express.static('.'));

// 导入路由
const orchestratorRouter = require('./routes/orchestrator');

// 使用路由
app.use('/api/orchestrator', orchestratorRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'OpenClaw Core',
    version: '修复版',
    timestamp: new Date().toISOString()
  });
});

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend.html');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在: http://localhost:${PORT}`);
  console.log(`📡 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔄 路由: http://localhost:${PORT}/api/orchestrator`);
});
