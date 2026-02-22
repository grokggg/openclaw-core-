const fs = require('fs');
const path = require('path');
const file = 'core/orchestrator/AgentOrchestrator.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('githubService')) {
    // 在开头添加引用
    content = 'const { commitArtifact } = require("../../services/githubService");\n' + content;
    // 在任务完成判定处强制插入调用
    content = content.replace(
        /console.log\(.*任务目标已达成.*\);/g,
        'console.log("✅ 目标达成，正在同步成果..."); commitArtifact(session.topic || "自动报告", JSON.stringify(session.data, null, 2));'
    );
    fs.writeFileSync(file, content);
    console.log('🚀 核心逻辑注入成功！');
} else {
    console.log('⚠️ 逻辑已存在，准备重新启动测试。');
}
