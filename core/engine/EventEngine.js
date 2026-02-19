const EventEmitter = require('events');
const supabase = require('../../config/supabase');

class EventEngine extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
    this.reactionMatrix = null;
    this.stats = { eventsProcessed: 0, eventsFailed: 0, avgProcessingTime: 0, lastEventAt: null };
  }
  async start() {
    console.log('🚀 启动事件驱动引擎...');
    await this.initReactionMatrix();
    await this.startRealtimeSubscription();
    this.startEventProcessor();
    this.startHeartbeat();
    console.log('✅ 事件引擎启动完成');
  }
  async initReactionMatrix() {
    console.log('🧠 初始化反应矩阵...');
    const { data, error } = await supabase.from('ops_reaction_matrix').select('*');
    if (error || !data || data.length === 0) {
      this.reactionMatrix = this.getDefaultReactionMatrix();
      console.log('📊 使用默认反应矩阵');
    } else {
      this.reactionMatrix = this.parseReactionMatrix(data);
      console.log(`📊 加载反应矩阵规则: ${data.length} 条`);
    }
  }
  parseReactionMatrix(data) {
    const matrix = {};
    data.forEach(rule => {
      if (rule.enabled !== false) {
        matrix[rule.event_type] = rule.agent_ids;
      }
    });
    return matrix;
  }
  getDefaultReactionMatrix() {
    return {
      'proposal.created': ['minion', 'sage'],
      'mission.created': ['minion', 'scout'],
      'mission.completed': ['observer', 'xalt'],
      'error.occurred': ['observer', 'minion'],
      'heartbeat': ['system'],
      'system.alert': ['minion', 'observer', 'sage']
    };
  }
  async startRealtimeSubscription() {
    console.log('📡 启动数据库实时订阅...');
    const proposalsSubscription = supabase
      .channel('ops_proposals_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ops_proposals' }, (payload) => {
        this.queueEvent({ type: 'proposal.created', data: payload.new, source: 'database', priority: 1 });
      })
      .subscribe();
    const missionsSubscription = supabase
      .channel('ops_missions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ops_missions' }, (payload) => {
        const eventType = `mission.${payload.eventType}`;
        this.queueEvent({ type: eventType, data: payload.new || payload.old, source: 'database', priority: 2 });
      })
      .subscribe();
    this.subscriptions.set('proposals', proposalsSubscription);
    this.subscriptions.set('missions', missionsSubscription);
  }
  queueEvent(event) {
    const enrichedEvent = { ...event, id: this.generateEventId(), timestamp: new Date().toISOString(), queuedAt: Date.now() };
    const index = this.eventQueue.findIndex(e => e.priority > enrichedEvent.priority);
    if (index === -1) { this.eventQueue.push(enrichedEvent); } 
    else { this.eventQueue.splice(index, 0, enrichedEvent); }
    console.log(`📥 事件入队: ${enrichedEvent.type} (优先级: ${enrichedEvent.priority})`);
    if (!this.isProcessing) { this.processEventQueue(); }
  }
  async processEventQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) { return; }
    this.isProcessing = true;
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      const startTime = Date.now();
      try {
        console.log(`⚡ 处理事件: ${event.type} [${event.id}]`);
        const handlers = this.getEventHandlers(event.type);
        this.emit(event.type, event);
        for (const handler of handlers) { await this.callEventHandler(handler, event); }
        await this.logEvent(event, 'processed');
        const processingTime = Date.now() - startTime;
        this.updateStats(event, processingTime, true);
      } catch (error) {
        console.error(`❌ 事件处理失败: ${event.type}`, error);
        await this.logEvent(event, 'failed', error.message);
        this.updateStats(event, Date.now() - startTime, false);
        if (event.retryCount < 3) {
          event.retryCount = (event.retryCount || 0) + 1;
          this.eventQueue.unshift(event);
          console.log(`🔄 重试事件: ${event.type} (尝试 ${event.retryCount}/3)`);
        }
      }
    }
    this.isProcessing = false;
  }
  getEventHandlers(eventType) { return this.reactionMatrix[eventType] || ['minion']; }
  async callEventHandler(handler, event) {
    console.log(`🤖 分配事件给: ${handler}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, handler, eventId: event.id };
  }
  async logEvent(event, status, error = null) {
    const logEntry = { type: event.type, event_id: event.id, data: event.data, status, error, source: event.source, processing_time: Date.now() - event.queuedAt, timestamp: new Date().toISOString() };
    const { error: dbError } = await supabase.from('ops_events').insert([logEntry]);
    if (dbError) { console.error('❌ 事件记录失败:', dbError); }
  }
  updateStats(event, processingTime, success) {
    this.stats.eventsProcessed++;
    this.stats.lastEventAt = new Date().toISOString();
    if (success) { this.stats.avgProcessingTime = (this.stats.avgProcessingTime * (this.stats.eventsProcessed - 1) + processingTime) / this.stats.eventsProcessed; } 
    else { this.stats.eventsFailed++; }
  }
  startHeartbeat() {
    setInterval(() => {
      this.queueEvent({ type: 'heartbeat', data: { timestamp: new Date().toISOString(), queueLength: this.eventQueue.length, ...this.stats }, source: 'system', priority: 0 });
    }, 60000);
  }
  startEventProcessor() { setInterval(() => { if (!this.isProcessing && this.eventQueue.length > 0) { this.processEventQueue(); } }, 100); }
  generateEventId() { return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  getStatus() {
    return { status: 'running', queueLength: this.eventQueue.length, isProcessing: this.isProcessing, stats: this.stats, subscriptions: Array.from(this.subscriptions.keys()), reactionMatrix: Object.keys(this.reactionMatrix || {}).length };
  }
  async stop() {
    console.log('🛑 停止事件引擎...');
    for (const [name, subscription] of this.subscriptions) { subscription.unsubscribe(); console.log(`📴 取消订阅: ${name}`); }
    this.subscriptions.clear(); this.eventQueue = []; this.isProcessing = false;
    console.log('✅ 事件引擎已停止');
  }
}
module.exports = EventEngine;
