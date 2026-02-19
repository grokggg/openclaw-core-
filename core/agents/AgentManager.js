/**
 * 🤖 智能体管理器 - 管理6个专业智能体
 * 设计：工厂模式 + 职责链模式
 */

const supabase = require('../../config/supabase');

class AgentManager {
  constructor() {
    this.agents = new Map();
    this.agentCapabilities = new Map();
    this.agentLoad = new Map();
    this.initAgents();
  }

  /**
   * 初始化6个智能体
   */
  initAgents() {
    const agentDefinitions = [
      {
        id: 'minion',
        name: 'CEO幕僚长',
        description: '负责决策协调和任务分发',
        capabilities: ['decision', 'coordination', 'prioritization'],
        maxConcurrentTasks: 5,
        weight: 1.0
      },
      {
        id: 'sage',
        name: '研究主管',
        description: '负责分析和战略规划',
        capabilities: ['analysis', 'strategy', 'research'],
        maxConcurrentTasks: 3,
        weight: 0.8
      },
      {
        id: 'scout',
        name: '增长主管',
        description: '负责情报收集和市场侦察',
        capabilities: ['intelligence', 'scouting', 'trend_analysis'],
        maxConcurrentTasks: 4,
        weight: 0.7
      },
      {
        id: 'quill',
        name: '创意总监',
        description: '负责内容创作和文案',
        capabilities: ['content_creation', 'copywriting', 'design'],
        maxConcurrentTasks: 3,
        weight: 0.6
      },
      {
        id: 'xalt',
        name: '社交媒体总监',
        description: '负责发布和用户互动',
        capabilities: ['social_media', 'engagement', 'distribution'],
        maxConcurrentTasks: 3,
        weight: 0.6
      },
      {
        id: 'observer',
        name: '质量检查',
        description: '负责审核和监督',
        capabilities: ['quality_check', 'monitoring', 'reporting'],
        maxConcurrentTasks: 2,
        weight: 0.5
      }
    ];

    // 注册所有智能体
    agentDefinitions.forEach(agent => {
      this.registerAgent(agent);
    });

    console.log(`✅ 智能体管理器初始化完成: ${this.agents.size} 个智能体`);
  }

  /**
   * 注册智能体
   */
  registerAgent(agentConfig) {
    const agent = {
      ...agentConfig,
      currentTasks: 0,
      status: 'idle',
      lastActive: null,
      stats: {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalProcessingTime: 0
      }
    };

    this.agents.set(agent.id, agent);
    this.agentLoad.set(agent.id, 0);

    // 更新能力映射
    agent.capabilities.forEach(capability => {
      if (!this.agentCapabilities.has(capability)) {
        this.agentCapabilities.set(capability, []);
      }
      this.agentCapabilities.get(capability).push(agent.id);
    });

    console.log(`🤖 注册智能体: ${agent.name} (${agent.id})`);
  }

  /**
   * 分配任务给最合适的智能体
   */
  async assignTask(task) {
    const { type, data, priority = 1 } = task;
    
    console.log(`📋 分配任务: ${type}`);
    
    // 1. 根据任务类型选择智能体
    const suitableAgents = this.findSuitableAgents(type, data);
    
    if (suitableAgents.length === 0) {
      throw new Error(`没有找到能处理任务类型 "${type}" 的智能体`);
    }

    // 2. 选择负载最低的智能体
    const selectedAgent = this.selectOptimalAgent(suitableAgents, priority);
    
    // 3. 创建任务记录
    const taskRecord = await this.createTaskRecord(selectedAgent.id, task);
    
    // 4. 更新智能体状态
    this.updateAgentLoad(selectedAgent.id, 1);
    
    // 5. 执行任务
    const result = await this.executeTask(selectedAgent.id, taskRecord);
    
    return {
      success: true,
      agent: selectedAgent,
      task: taskRecord,
      result
    };
  }

  /**
   * 查找合适的智能体
   */
  findSuitableAgents(taskType, taskData) {
    const suitableAgents = [];
    
    // 根据任务类型映射到能力
    const requiredCapabilities = this.mapTaskToCapabilities(taskType, taskData);
    
    for (const [agentId, agent] of this.agents) {
      if (this.hasRequiredCapabilities(agent, requiredCapabilities)) {
        suitableAgents.push(agent);
      }
    }
    
    return suitableAgents;
  }

  /**
   * 映射任务类型到能力
   */
  mapTaskToCapabilities(taskType, taskData) {
    const capabilityMap = {
      'proposal.analyze': ['analysis', 'research'],
      'proposal.strategize': ['strategy', 'decision'],
      'content.create': ['content_creation', 'copywriting'],
      'social.publish': ['social_media', 'distribution'],
      'market.research': ['intelligence', 'scouting'],
      'quality.review': ['quality_check', 'monitoring'],
      'emergency.handle': ['decision', 'coordination']
    };

    return capabilityMap[taskType] || ['decision'];
  }
  /**
   * 检查智能体是否具备所需能力
   */
  hasRequiredCapabilities(agent, requiredCapabilities) {
    return requiredCapabilities.every(cap => 
      agent.capabilities.includes(cap)
    );
  }

  /**
   * 选择最优智能体
   */
  selectOptimalAgent(suitableAgents, priority) {
    // 计算每个智能体的得分
    const scoredAgents = suitableAgents.map(agent => {
      const loadScore = this.agentLoad.get(agent.id) / agent.maxConcurrentTasks;
      const weightScore = agent.weight;
      const freshnessScore = agent.lastActive ? 
        (Date.now() - new Date(agent.lastActive).getTime()) / 3600000 : 1; // 小时为单位
      
      const score = (
        (1 - loadScore) * 0.4 +      // 负载越低越好
        weightScore * 0.3 +           // 权重
        (1 / (1 + freshnessScore)) * 0.3 // 最近活跃
      ) * (priority * 0.5 + 0.5);     // 优先级调整
      
      return { agent, score };
    });

    // 选择得分最高的智能体
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0].agent;
  }

  /**
   * 创建任务记录
   */
  async createTaskRecord(agentId, task) {
    const taskRecord = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_id: agentId,
      type: task.type,
      data: task.data,
      priority: task.priority || 1,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // 保存到数据库
    const { error } = await supabase
      .from('ops_agent_tasks')
      .insert([taskRecord]);

    if (error) {
      throw new Error(`任务记录创建失败: ${error.message}`);
    }

    return taskRecord;
  }

  /**
   * 更新智能体负载
   */
  updateAgentLoad(agentId, delta) {
    const currentLoad = this.agentLoad.get(agentId) || 0;
    const agent = this.agents.get(agentId);
    
    const newLoad = Math.max(0, Math.min(agent.maxConcurrentTasks, currentLoad + delta));
    this.agentLoad.set(agentId, newLoad);
    
    // 更新智能体状态
    agent.currentTasks = newLoad;
    agent.status = newLoad >= agent.maxConcurrentTasks ? 'busy' : 
                   newLoad > 0 ? 'active' : 'idle';
    agent.lastActive = new Date().toISOString();
  }

  /**
   * 执行任务
   */
  async executeTask(agentId, taskRecord) {
    console.log(`⚡ 智能体 ${agentId} 开始执行任务: ${taskRecord.type}`);
    
    const startTime = Date.now();
    let result;
    
    try {
      // 根据任务类型调用不同的处理函数
      result = await this.handleTaskByType(agentId, taskRecord);
      
      // 更新任务状态
      await this.updateTaskStatus(taskRecord.id, 'completed', result);
      
      // 更新智能体统计
      this.updateAgentStats(agentId, true, Date.now() - startTime);
      
      console.log(`✅ 任务完成: ${taskRecord.id} (${Date.now() - startTime}ms)`);
      
    } catch (error) {
      console.error(`❌ 任务失败: ${taskRecord.id}`, error);
      
      await this.updateTaskStatus(taskRecord.id, 'failed', { error: error.message });
      this.updateAgentStats(agentId, false, Date.now() - startTime);
      
      result = { success: false, error: error.message };
    } finally {
      // 释放智能体负载
      this.updateAgentLoad(agentId, -1);
    }
    
    return result;
  }
  /**
   * 根据任务类型处理
   */
  async handleTaskByType(agentId, taskRecord) {
    const handlerMap = {
      'proposal.analyze': this.handleProposalAnalysis,
      'content.create': this.handleContentCreation,
      'social.publish': this.handleSocialPublish,
      'market.research': this.handleMarketResearch,
      'quality.review': this.handleQualityReview
    };

    const handler = handlerMap[taskRecord.type] || this.handleDefaultTask;
    return await handler.call(this, agentId, taskRecord);
  }

  /**
   * 处理提案分析任务
   */
  async handleProposalAnalysis(agentId, taskRecord) {
    // 模拟AI分析
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      analysis: {
        complexity: Math.random() > 0.5 ? 'high' : 'medium',
        estimated_time: Math.floor(Math.random() * 120) + 30, // 30-150分钟
        recommended_actions: ['research', 'strategy_session', 'review']
      },
      insights: [
        '检测到市场趋势变化',
        '建议深入竞争对手分析',
        '需要跨部门协作'
      ]
    };
  }

  /**
   * 处理内容创建任务
   */
  async handleContentCreation(agentId, taskRecord) {
    // 模拟内容生成
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      content: {
        title: `智能生成内容: ${taskRecord.data.topic || '未指定主题'}`,
        body: '这是由AI智能体生成的专业内容，基于最新数据分析和市场趋势。',
        format: 'article',
        word_count: Math.floor(Math.random() * 500) + 300
      },
      seo_recommendations: [
        '优化关键词密度',
        '添加内部链接',
        '优化元描述'
      ]
    };
  }

  /**
   * 处理社交媒体发布任务
   */
  async handleSocialPublish(agentId, taskRecord) {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      platforms: ['twitter', 'linkedin', 'facebook'],
      message: '智能体生成的专业社交媒体内容已就绪',
      scheduled_time: new Date(Date.now() + 3600000).toISOString(), // 1小时后
      engagement_forecast: {
        estimated_reach: Math.floor(Math.random() * 10000) + 1000,
        expected_engagement: Math.floor(Math.random() * 200) + 50
      }
    };
  }

  /**
   * 处理市场研究任务
   */
  async handleMarketResearch(agentId, taskRecord) {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    return {
      trends: [
        'AI自动化需求增长25%',
        '远程协作工具使用量上升',
        '可持续发展成为投资热点'
      ],
      competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
      recommendations: [
        '加强产品差异化',
        '拓展国际市场',
        '建立战略合作伙伴关系'
      ]
    };
  }

  /**
   * 处理质量检查任务
   */
  async handleQualityReview(agentId, taskRecord) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      quality_score: Math.floor(Math.random() * 100) + 1,
      issues_found: Math.floor(Math.random() * 5),
      recommendations: [
        '优化代码结构',
        '增加测试覆盖率',
        '改进文档注释'
      ],
      passed: Math.random() > 0.3
    };
  }

  /**
   * 默认任务处理
   */
  async handleDefaultTask(agentId, taskRecord) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      message: `任务 ${taskRecord.type} 已由 ${agentId} 处理`,
      timestamp: new Date().toISOString(),
      data: taskRecord.data
    };
  }
  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status, result = null) {
    const updateData = {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      result
    };

    const { error } = await supabase
      .from('ops_agent_tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      console.error('任务状态更新失败:', error);
    }
  }

  /**
   * 更新智能体统计
   */
  updateAgentStats(agentId, success, processingTime) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (success) {
      agent.stats.tasksCompleted++;
      agent.stats.totalProcessingTime += processingTime;
    } else {
      agent.stats.tasksFailed++;
    }
  }

  /**
   * 获取智能体状态
   */
  getAgentStatus() {
    const agentsArray = Array.from(this.agents.values());
    
    return {
      totalAgents: agentsArray.length,
      activeAgents: agentsArray.filter(a => a.status === 'active').length,
      busyAgents: agentsArray.filter(a => a.status === 'busy').length,
      idleAgents: agentsArray.filter(a => a.status === 'idle').length,
      agents: agentsArray.map(agent => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        currentTasks: agent.currentTasks,
        maxTasks: agent.maxConcurrentTasks,
        capabilities: agent.capabilities,
        stats: agent.stats,
        lastActive: agent.lastActive
      }))
    };
  }

  /**
   * 获取系统负载
   */
  getSystemLoad() {
    let totalLoad = 0;
    let totalCapacity = 0;
    
    for (const [agentId, load] of this.agentLoad) {
      const agent = this.agents.get(agentId);
      if (agent) {
        totalLoad += load;
        totalCapacity += agent.maxConcurrentTasks;
      }
    }
    
    return {
      currentLoad: totalLoad,
      totalCapacity: totalCapacity,
      utilizationRate: totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0,
      availableCapacity: totalCapacity - totalLoad
    };
  }
}

module.exports = AgentManager;
