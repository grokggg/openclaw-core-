#!/bin/bash
echo "🔧 修复OpenClaw服务器配置..."
echo "=============================="

# 停止现有服务器
echo "1. 停止现有服务器..."
pkill -f "node.*server" 2>/dev/null || echo "无运行中的服务器"

# 备份原始配置
echo "2. 备份配置..."
[ -f server.js ] && cp server.js server.js.bak.$(date +%s)

# 创建正确的server.js
echo "3. 创建正确的服务器配置..."
cat > server.js << 'SERVER_EOF'
const express = require('express');
const app = express();

// 根路径
app.get('/', (req, res) => res.send('🎯 OpenClaw AI v2.0 运行正常!'));

// 健康检查
app.get('/health', (req, res) => res.json({status: 'healthy'}));

// API文档
app.get('/api/v1', (req, res) => res.json({version: '2.0.0'}));

// 启动
const PORT = 3002;
app.listen(PORT, () => console.log(\`🚀 服务器运行在 http://localhost:\${PORT}\`));
SERVER_EOF

echo "✅ 配置完成！"
echo "🚀 启动命令: node server.js"
