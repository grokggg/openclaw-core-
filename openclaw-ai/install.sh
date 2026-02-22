#!/bin/bash

echo "🚀 OpenClaw AI Orchestrator 安装脚本"
echo "=========================================="

# 检查Node版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "❌ 需要Node.js 16或更高版本，当前版本: $(node -v)"
  exit 1
fi
echo "✅ Node.js版本: $(node -v)"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建必要的目录
echo "📁 创建目录结构..."
mkdir -p storage/{logs,sessions,templates}
mkdir -p tests/{unit,integration}

# 设置权限
chmod -R 755 storage
chmod +x server.js

echo ""
echo "✨ 安装完成!"
echo ""
echo "启动命令:"
echo "  🚀 开发模式: npm run dev"
echo "  🔄 开发模式(热重载): npm run dev:watch"
echo "  🏗️  生产模式: npm start"
echo ""
echo "访问地址:"
echo "  🌐 本地: http://localhost:3002"
echo "  📊 健康检查: http://localhost:3002/health"
echo "  📚 API文档: http://localhost:3002/api/v1"
echo ""
echo "快速测试:"
echo "  curl http://localhost:3002/health"
