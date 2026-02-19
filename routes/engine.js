const express = require('express');
const router = express.Router();
const engineService = require('../services/EngineService');
router.post('/start', async (req, res) => {
  try { await engineService.start(); res.json({ success: true, message: '引擎启动成功', timestamp: new Date().toISOString() }); } 
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/stop', async (req, res) => {
  try { await engineService.stop(); res.json({ success: true, message: '引擎停止成功', timestamp: new Date().toISOString() }); } 
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.get('/status', (req, res) => {
  try { const status = engineService.getSystemStatus(); res.json({ success: true, data: status, timestamp: new Date().toISOString() }); } 
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/trigger-event', async (req, res) => {
  try { const { type, data } = req.body; if (!type) { return res.status(400).json({ success: false, error: '事件类型(type)是必需的' }); }
    const result = await engineService.triggerEvent(type, data); res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.post('/assign-task', async (req, res) => {
  try { const { type, data } = req.body; if (!type) { return res.status(400).json({ success: false, error: '任务类型(type)是必需的' }); }
    const result = await engineService.assignManualTask(type, data); res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.get('/agents', (req, res) => {
  try { const status = engineService.getSystemStatus(); res.json({ success: true, data: status.agents, timestamp: new Date().toISOString() }); } 
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
router.get('/system-load', (req, res) => {
  try { const status = engineService.getSystemStatus(); res.json({ success: true, data: status.systemLoad, timestamp: new Date().toISOString() }); } 
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
module.exports = router;
