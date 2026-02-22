const fs = require('fs');
const filePath = 'routes/orchestrator.js';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 查找并替换返回的data对象
  if (content.includes("data: {}")) {
    const replacement = `data: { 
        sessionId: session.id || sessionId, 
        type: session.type || workflowType, 
        status: session.status || 'active', 
        startTime: session.startTime || new Date().toISOString() 
      }`;
    
    content = content.replace(/data: \{\}/g, replacement);
    fs.writeFileSync(filePath, content);
    console.log('✅ 成功修复路由文件，确保返回完整的sessionId数据');
  } else {
    console.log('⚠️  未找到data: {}模式，检查文件结构');
    
    // 尝试更具体的替换
    const pattern = /res\.json\(\{[\s\S]*?success:\s*true,[\s\S]*?data:\s*\{\}[\s\S]*?\}\)/;
    if (pattern.test(content)) {
      const replacement = `res.json({
      success: true,
      data: {
        sessionId: session.id || sessionId,
        type: session.type || workflowType,
        status: session.status || 'active',
        startTime: session.startTime || new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })`;
      
      content = content.replace(pattern, replacement);
      fs.writeFileSync(filePath, content);
      console.log('✅ 通过正则表达式成功修复路由文件');
    } else {
      console.log('❌ 无法定位需要修复的代码段，请手动查看文件');
    }
  }
} catch (error) {
  console.error('❌ 修复失败:', error.message);
}
