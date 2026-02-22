const axios = require('axios');
const cron = require('node-cron');

async function fetchTopAINews() {
    try {
        console.log('📡 [雷达] 正在扫描 Hacker News 热点...');
        // 获取最新热门故事的 ID
        const { data: storyIds } = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty');
        
        // 取前 3 个进行分析
        const topStories = await Promise.all(
            storyIds.slice(0, 3).map(id => 
                axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.data)
            )
        );

        // 筛选包含 AI/ML/DeepSeek 等关键词的内容
        const aiNews = topStories.filter(s => /AI|Model|Machine Learning|DeepSeek|Sora/i.test(s.title));
        
        return aiNews.length > 0 ? aiNews[0].title : "全球 AI 行业常规动态监控";
    } catch (error) {
        console.error('❌ [雷达] 抓取失败:', error.message);
        return null;
    }
}

function startAutoPilot(orchestrator) {
    // 设定每 30 分钟检查一次
    cron.schedule('*/30 * * * *', async () => {
        const topic = await fetchTopAINews();
        if (topic) {
            console.log(`🔥 [自动驾驶] 检测到高价值话题: ${topic}`);
            orchestrator.triggerWorkflow('content_campaign', { topic });
        }
    });
}

module.exports = { startAutoPilot };
