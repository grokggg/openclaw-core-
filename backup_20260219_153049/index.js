require('dotenv').config();
const express = require('express');
const engineRoutes = require('./routes/engine');
const app = express();
const PORT = 3002;
app.use(express.json());
app.use('/api/engine', engineRoutes);
app.get('/health', (req, res) => { res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'OpenClaw Core Engine' }); });
  console.log(`🚀 OpenClaw核心引擎启动: http://localhost:${PORT}`);
});
process.on('SIGTERM', async () => { console.log('🛑 接收到SIGTERM信号，正在关闭引擎...'); server.close(() => { console.log('✅ 服务器已关闭'); process.exit(0); }); });
process.on('SIGINT', async () => { console.log('🛑 接收到SIGINT信号，正在关闭引擎...'); server.close(() => { console.log('✅ 服务器已关闭'); process.exit(0); }); });
module.exports = app;

// 导入协同编排路由
const { router: orchestratorRouter } = require('./routes/orchestrator');
app.use('/api/orchestrator', orchestratorRouter);
    // 提供前端演示页面
    app.get('/', (req, res) => {
// 提供前端演示页面
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend.html");
});


