const EventEngine = require('../core/engine/EventEngine');
const AgentManager = require('../core/agents/AgentManager');
class EngineService {
  constructor() { this.eventEngine = null; this.agentManager = null; this.isRunning = false; this.startTime = null; }
  async start() {
    if (this.isRunning) { console.log('⚠️ 引擎已在运行中'); return; }
    console.log('🚀 启动OpenClaw主引擎...'); this.startTime = new Date().toISOString();
    try {
      this.eventEngine = new EventEngine(); this.agentManager = new AgentManager();
      this.setupComponentCommunication(); await this.eventEngine.start(); this.isRunning = true;
      console.log('✅ OpenClaw主引擎启动完成'); console.log('⏰ 启动时间:', this.startTime);
      console.log('📊 初始化组件:'); console.log('  • 事件引擎: 已启动'); console.log('  • 智能体管理器: 已加载6个智能体'); console.log('🔧 系统状态: 运行中');
    } catch (error) { console.error('❌ 引擎启动失败:', error); throw error; }
  }
  setupComponentCommunication() {
    this.eventEngine.on('proposal.created', async (event) => {
      console.log('📨 接收到提案创建事件，分发给智能体...');
      try {
        const result = await this.agentManager.assignTask({ type: 'proposal.analyze', data: event.data, priority: 1 });
        console.log(`✅ 提案分析任务已分配: ${result.agent.name}`);
      } catch (error) { console.error('提案分析任务分配失败:', error); }
    });
    this.eventEngine.on('mission.created', async (event) => {
      console.log('📨 接收到任务创建事件，分发给智能体...');
      try {
        const result = await this.agentManager.assignTask({ type: 'mission.execute', data: event.data, priority: 2 });
        console.log(`✅ 任务执行已分配: ${result.agent.name}`);
      } catch (error) { console.error('任务分配失败:', error); }
    });
    setInterval(() => { this.reportStatus(); }, 30000);
  }
  reportStatus() {
    if (!this.isRunning) return; const now = new Date(); const uptime = Math.floor((now - new Date(this.startTime)) / 1000);
    const agentStatus = this.agentManager ? this.agentManager.getAgentStatus() : null;
    const systemLoad = this.agentManager ? this.agentManager.getSystemLoad() : null;
    const eventStats = this.eventEngine ? this.eventEngine.getStatus() : null;
    console.log('\n📈 系统状态报告'); console.log('=' .repeat(40));
    console.log(`⏰ 运行时间: ${uptime} 秒`);
    console.log(`🤖 智能体: ${agentStatus ? `${agentStatus.activeAgents}/${agentStatus.totalAgents} 活跃` : '未初始化'}`);
    console.log(`📊 系统负载: ${systemLoad ? `${systemLoad.utilizationRate.toFixed(1)}%` : 'N/A'}`);
    console.log(`📨 事件队列: ${eventStats ? eventStats.queueLength : 'N/A'}`); console.log('=' .repeat(40));
  }
  async triggerEvent(eventType, data = {}) {
    if (!this.eventEngine) { throw new Error('事件引擎未启动'); }
    console.log(`🎯 手动触发事件: ${eventType}`);
    this.eventEngine.queueEvent({ type: eventType, data, source: 'manual', priority: 1 });
    return { success: true, eventType, timestamp: new Date().toISOString() };
  }
  async assignManualTask(taskType, data = {}) {
    if (!this.agentManager) { throw new Error('智能体管理器未启动'); }
    console.log(`🎯 手动分配任务: ${taskType}`);
    const result = await this.agentManager.assignTask({ type: taskType, data, priority: 1 });
    return result;
  }
  getSystemStatus() {
    if (!this.isRunning) { return { status: 'stopped', message: '引擎未运行' }; }
    const agentStatus = this.agentManager.getAgentStatus(); const systemLoad = this.agentManager.getSystemLoad(); const eventStats = this.eventEngine.getStatus();
    return { status: 'running', startTime: this.startTime, uptime: Math.floor((Date.now() - new Date(this.startTime).getTime()) / 1000), components: { eventEngine: eventStats.status, agentManager: 'running' }, agents: { total: agentStatus.totalAgents, active: agentStatus.activeAgents, busy: agentStatus.busyAgents, idle: agentStatus.idleAgents, details: agentStatus.agents }, systemLoad: { current: systemLoad.currentLoad, capacity: systemLoad.totalCapacity, utilization: systemLoad.utilizationRate, available: systemLoad.availableCapacity }, events: { processed: eventStats.stats.eventsProcessed, failed: eventStats.stats.eventsFailed, avgTime: eventStats.stats.avgProcessingTime, queueLength: eventStats.queueLength } };
  }
  async stop() {
    if (!this.isRunning) { return; } console.log('🛑 停止OpenClaw主引擎...');
    try { if (this.eventEngine) { await this.eventEngine.stop(); } this.isRunning = false; console.log('✅ OpenClaw主引擎已停止'); } 
    catch (error) { console.error('停止引擎时出错:', error); throw error; }
  }
}
const engineService = new EngineService();
module.exports = engineService;
