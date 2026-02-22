#!/bin/bash
echo "🎯 OpenClaw AI Orchestrator 安装脚本 v2.0"
echo "========================================"

# 检查Node.js版本
echo "🔍 检查Node.js版本..."
node -v || { echo "❌ Node.js 未安装"; exit 1; }

# 安装依赖
echo "📦 安装依赖..."
npm install

# 设置权限
echo "🔐 设置文件权限..."
chmod +x server.js

echo "✅ 安装完成！"
echo "🚀 启动命令: npm start 或 npm run dev"
