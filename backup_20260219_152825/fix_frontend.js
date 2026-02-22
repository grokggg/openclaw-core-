const fs = require('fs');
const path = './frontend.html';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. 查找位置插入工作流面板
  const insertPoint = content.indexOf('<!-- 智能体团队面板 -->');
  if (insertPoint !== -1) {
    const workflowPanel = `
<!-- 工作流控制面板 -->
<section class="card">
    <h2><i class="fas fa-play-circle"></i> 启动工作流</h2>
    <p style="color:#94a3b8; margin-bottom:1.2rem;">选择模板，一键启动智能体协同流程</p>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
        <button class="btn" onclick="startWorkflow('product_launch')" id="btnProductLaunch">
            <i class="fas fa-rocket"></i> 启动产品发布
        </button>
        <button class="btn" onclick="startWorkflow('content_campaign')" id="btnContentCampaign">
            <i class="fas fa-bullhorn"></i> 启动内容营销
        </button>
        <button class="btn" onclick="startWorkflow('market_research')" id="btnMarketResearch">
            <i class="fas fa-chart-line"></i> 启动市场调研
        </button>
    </div>
    <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid #334155;">
        <button class="btn" onclick="fetchActiveSessions()">
            <i class="fas fa-list"></i> 查看活跃会话
        </button>
    </div>
</section>
`;
    content = content.slice(0, insertPoint) + workflowPanel + content.slice(insertPoint);
    console.log('✅ 工作流面板已添加');
  }
  
  // 2. 添加JavaScript函数
  if (!content.includes('function startWorkflow')) {
    const jsCode = `
    // 启动工作流功能
    function startWorkflow(workflowType) {
        console.log('启动工作流:', workflowType);
        const button = document.getElementById('btn' + workflowType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 启动中...';
            button.disabled = true;
            
            fetch('/api/orchestrator/sessions/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflowType: workflowType })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.success ? '✅ 启动成功！' : '❌ 启动失败');
                console.log('响应:', data);
            })
            .catch(error => {
                alert('❌ 网络错误: ' + error.message);
            })
            .finally(() => {
                if (button) {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            });
        }
    }
    
    // 获取活跃会话
    function fetchActiveSessions() {
        fetch('/api/orchestrator/sessions')
            .then(response => response.json())
            .then(data => {
                alert('当前活跃会话: ' + (data.data?.count || 0) + '个');
            })
            .catch(error => {
                console.error('获取会话失败:', error);
            });
    }
    `;
    
    // 插入到第一个script标签前
    const scriptPos = content.indexOf('</script>');
    if (scriptPos !== -1) {
        content = content.slice(0, scriptPos) + jsCode + content.slice(scriptPos);
        console.log('✅ JavaScript函数已添加');
    }
  }
  
  fs.writeFileSync(path, content);
  console.log('🎯 前端修复成功！请刷新浏览器查看效果');
  
} catch (error) {
  console.error('修复失败:', error);
}
