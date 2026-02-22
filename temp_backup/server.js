const express = require('express');
const app = express();
const PORT = 3002;

// 基础健康检查 API
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'OpenClaw Core' });
});

// 基础引擎状态 API (模拟)
app.get('/api/engine/status', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      components: { eventEngine: 'running', agentManager: 'running' },
      systemLoad: { utilization: 0 },
      agents: [] 
    } 
  });
});

// 智能体协同编排 API 路由
const { router: orchestratorRouter } = require('./routes/orchestrator');
app.use('/api/orchestrator', orchestratorRouter);

// 核心：提供前端页面的路由
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend.html');
});

const server = app.listen(PORT, () => {
  console.log(`✅ 前端集成服务器已启动: http://localhost:${PORT}`);
});
