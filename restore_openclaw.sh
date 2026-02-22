#!/bin/bash

echo "=== OpenClaw 系統恢復工具 ==="
echo ""

BACKUP_DIR="/workspaces/openclaw-backups"

# 檢查備份目錄是否存在
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ 備份目錄不存在: $BACKUP_DIR"
  echo "請先運行備份腳本創建備份"
  exit 1
fi

# 顯示可用備份
echo "可用的備份文件："
echo ""
ls -lh $BACKUP_DIR/openclaw-backup-*.tar.gz 2>/dev/null

if [ $? -ne 0 ]; then
  echo "❌ 未找到任何備份文件"
  exit 1
fi

echo ""
read -p "請輸入要恢復的備份文件名（或按Enter使用最新的）： " BACKUP_CHOICE

# 如果未選擇，使用最新的備份
if [ -z "$BACKUP_CHOICE" ]; then
  BACKUP_FILE=$(ls -t $BACKUP_DIR/openclaw-backup-*.tar.gz 2>/dev/null | head -1)
else
  BACKUP_FILE="$BACKUP_DIR/$BACKUP_CHOICE"
fi

# 檢查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 備份文件不存在: $BACKUP_FILE"
  exit 1
fi

echo ""
echo "您選擇的備份: $(basename $BACKUP_FILE)"
echo "檔案大小: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "創建時間: $(stat -c %y "$BACKUP_FILE" 2>/dev/null || date -r "$BACKUP_FILE")"
echo ""

# 確認恢復
read -p "⚠️  警告：這將覆蓋當前文件！確定要恢復嗎？(y/N): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
  echo "恢復操作已取消"
  exit 0
fi

echo ""
echo "正在停止當前伺服器..."
pkill -f "node.*server" 2>/dev/null
sleep 2

echo "正在恢復備份..."
cd /workspaces/openclaw-core-

# 備份當前文件（可選）
CURRENT_BACKUP="$BACKUP_DIR/current-before-restore-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" \
  server_rock.js \
  frontend.html \
  simple_test.html \
  click_test.html \
  *.json 2>/dev/null
echo "當前文件已備份到: $(basename $CURRENT_BACKUP)"

# 恢復備份
tar -xzf "$BACKUP_FILE"

echo "✅ 恢復完成！"
echo ""
echo "恢復的文件："
tar -tzf "$BACKUP_FILE" | sed 's/^/  /'
echo ""
echo "您可以啟動伺服器："
echo "cd /workspaces/openclaw-core-"
echo "node server_rock.js"
