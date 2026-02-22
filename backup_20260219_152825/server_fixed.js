const express = require('express');
const app = express();
const PORT = 3002;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'OpenClaw Core Engine'
  });
});

// 智能体协同路由
const { router: orchestratorRouter } = require('./routes/orchestrator');
app.use('/api/orchestrator', orchestratorRouter);

// 前端页面
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend.html');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 OpenClaw核心引擎启动：http://localhost:${PORT}`);
  console.log('✅ 前端界面可访问: http://localhost:' + PORT);
});
