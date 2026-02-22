#!/bin/bash
cd /workspaces/openclaw-core-

# 备份原文件
cp frontend.html frontend.html.before_fix

# 查找</script>标签的位置
LINE=$(grep -n "</script>" frontend.html | head -1 | cut -d: -f1)

# 在</script>前插入修复代码
if [ ! -z "$LINE" ]; then
  # 创建临时文件
  head -n $((LINE-1)) frontend.html > temp.html
  echo "<script>" >> temp.html
  cat fix_id_undefined.js >> temp.html
  echo "</script>" >> temp.html
  tail -n +$LINE frontend.html >> temp.html
  
  mv temp.html frontend.html
  echo "✅ 修复代码已注入前端"
else
  echo "❌ 未找到</script>标签"
fi
