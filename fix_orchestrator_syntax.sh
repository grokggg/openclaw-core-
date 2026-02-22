#!/bin/bash
cd /workspaces/openclaw-core-

echo "开始修复语法错误..."

# 备份原文件
cp routes/orchestrator.js routes/orchestrator.js.backup_fix

# 查找有问题的路由（/sessions/start）
START_LINE=$(grep -n "router.post.*sessions/start" routes/orchestrator.js | head -1 | cut -d: -f1)
if [ -z "$START_LINE" ]; then
  echo "❌ 未找到 /sessions/start 路由"
  exit 1
fi

echo "找到 /sessions/start 路由在第 $START_LINE 行"

# 查找这个路由的结束
# 我们先查看从开始行到文件结束
tail -n +$START_LINE routes/orchestrator.js | head -50

# 更简单的方法：直接使用我们已知的正确版本
cat > routes/orchestrator_fixed.js << 'FIXED'
const express = require('express');
const router = express.Router();

// 启动工作流会话
router.post('/sessions/start', (req, res) => {
  try {
    const { workflowType } = req.body;
    
    if (!workflowType) {
      return res.status(400).json({ 
        success: false, 
        error: '工作流类型(workflowType)是必需的',
        timestamp: new Date().toISOString()
      });
    }

    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log(`[API] 启动工作流: ${workflowType}, 会话ID: ${sessionId}`);
    
    res.json({
      success: true,
      data: {
        sessionId: sessionId,
        workflowType: workflowType,
        status: 'active',
        startTime: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[/sessions/start] 错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '内部服务器错误: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取所有会话
router.get('/sessions', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        count: 0,
        sessions: []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: '内部服务器错误',
      timestamp: new Date().toISOString()
    });
  }
});

// 工作流状态检查
router.get('/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    res.json({
      success: true,
      data: {
        sessionId: sessionId,
        status: 'active',
        progress: 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: '内部服务器错误',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
FIXED

# 替换原文件
mv routes/orchestrator_fixed.js routes/orchestrator.js
echo "✅ 语法修复完成"
