const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;

app.use(express.static(path.join(__dirname, 'frontend')));

// 模拟你截图里的 Agent 协同逻辑
const agents = [
    { id: "minion", task: "strategize", emoji: "🤖" },
    { id: "sage", task: "analyze_market", emoji: "🧙" },
    { id: "scout", task: "competitive_analysis", emoji: "🛰️" },
    { id: "quill", task: "create_content", emoji: "✍️" },
    { id: "xalt", task: "plan_distribution", emoji: "📢" },
    { id: "observer", task: "quality_assurance", emoji: "✅" }
];

app.get('/api/stream-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let runtime = 0;
    const interval = setInterval(() => {
        runtime += 30;
        const report = `
📈 系统状态报告 ----------------------
⏰ 运行时间: ${runtime} 秒
🤖 智能体: ${Math.floor(Math.random()*6)}/6 活跃
📊 系统负载: ${(Math.random()*5).toFixed(1)}%
📦 事件队列: 0
------------------------------------`;
        res.write(`data: ${JSON.stringify({ type: 'status', msg: report })}\n\n`);
    }, 5000);

    req.on('close', () => clearInterval(interval));
});

app.listen(PORT, () => console.log(`🚀 OpenClaw Core 引擎已在 ${PORT} 唤醒`));
