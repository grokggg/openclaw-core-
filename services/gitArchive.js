const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function archiveToGithub(topic, content) {
    const fileName = `report-${Date.now()}.md`;
    const filePath = path.join(__dirname, '../reports', fileName);
    
    // 确保 reports 文件夹存在
    if (!fs.existsSync(path.join(__dirname, '../reports'))) {
        fs.mkdirSync(path.join(__dirname, '../reports'));
    }

    const fileContent = `# AI 深度分析报告: ${topic}\n\n> 归档时间: ${new Date().toLocaleString()}\n\n${content}`;

    fs.writeFileSync(filePath, fileContent);

    console.log('📦 [归档] 报告已生成，准备同步至 GitHub...');

    const commands = [
        'git add .',
        `git commit -m "🤖 自动报告: ${topic}"`,
        'git push origin main'
    ].join(' && ');

    exec(commands, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ [Git] 同步失败: ${error.message}`);
            return;
        }
        console.log('✅ [Git] 仓库更新成功！');
    });
}

module.exports = { archiveToGithub };
