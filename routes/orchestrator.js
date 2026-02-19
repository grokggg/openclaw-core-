const express = require('express');
const router = express.Router();

let orchestrator = null;

const initializeOrchestrator = (agentManager) => {
  if (!orchestrator && agentManager) {
    const AgentOrchestrator = require('../core/orchestrator/AgentOrchestrator');
    orchestrator = new AgentOrchestrator(agentManager);
    console.log('🎵 智能体协同编排器已初始化');
  }
  return orchestrator;
};

router.post('/sessions/start', (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(503).json({ 
        success: false, 
        error: '编排器未初始化，请先启动智能体引擎' 
      });
    }
    const { workflowType, data } = req.body;
    if (!workflowType) {
      return res.status(400).json({ 
        success: false, 
        error: '工作流类型(workflowType)是必需的' 
      });
    }
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = orchestrator.startCollaboration(sessionId, workflowType, data || {});
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        type: session.type,
        status: session.status,
        startTime: session.startTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/sessions/:sessionId', (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(503).json({ 
        success: false, 
        error: '编排器未初始化' 
      });
    }
    const { sessionId } = req.params;
    const session = orchestrator.getSessionStatus(sessionId);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: '会话不存在' 
      });
    }
    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sessions', (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(503).json({ 
        success: false, 
        error: '编排器未初始化' 
      });
    }
    const sessions = orchestrator.getAllSessions();
    res.json({
      success: true,
      data: {
        count: sessions.length,
        sessions: sessions.map(s => ({
          id: s.id,
          type: s.type,
          status: s.status,
          startTime: s.startTime,
          currentStep: s.currentStep
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get('/workflows', (req, res) => {
  res.json({
    success: true,
    data: {
      workflows: [
        {
          id: 'product_launch',
          name: '产品发布工作流',
          description: '完整的GTM策略：从市场分析到发布执行',
          estimatedTime: '8-12分钟',
          agents: ['minion', 'sage', 'scout', 'quill', 'xalt', 'observer']
        },
        {
          id: 'content_campaign',
          name: '内容营销战役',
          description: '从主题研究到多渠道分发的内容营销流程',
          estimatedTime: '6-8分钟',
          agents: ['sage', 'quill', 'observer', 'xalt']
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = { router, initializeOrchestrator };

// 自动初始化协同编排器（简化版，用于演示）
const AgentOrchestrator = require('../core/orchestrator/AgentOrchestrator');
orchestrator = new AgentOrchestrator(null);
console.log('🎵 协同编排器已自动初始化（演示模式）');
