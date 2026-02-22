#!/bin/bash

echo "=== OpenClaw 系統備份工具 ==="
echo ""

# 創建備份目錄
BACKUP_DIR="/workspaces/openclaw-backups"
mkdir -p $BACKUP_DIR

# 生成備份文件名（帶時間戳）
BACKUP_FILE="openclaw-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo "備份時間: $(date)"
echo "備份目錄: $BACKUP_DIR"
echo "備份文件: $BACKUP_FILE"
echo ""

# 列出要備份的關鍵文件
echo "正在備份以下關鍵文件："
echo "1. server_rock.js (伺服器程式)"
echo "2. frontend.html (前端介面)"
echo "3. simple_test.html (測試頁面)"
echo "4. 其他相關文件"
echo ""

# 創建備份
tar -czf "$BACKUP_PATH" \
  server_rock.js \
  frontend.html \
  simple_test.html \
  click_test.html \
  *.json 2>/dev/null

# 檢查備份是否成功
if [ $? -eq 0 ]; then
  echo "✅ 備份成功！"
  echo "備份檔案: $BACKUP_PATH"
  echo "檔案大小: $(du -h "$BACKUP_PATH" | cut -f1)"
  echo ""
  
  # 顯示備份清單
  echo "備份內容："
  tar -tzf "$BACKUP_PATH" | sed 's/^/  /'
  echo ""
  
  # 創建恢復指令
  cat > $BACKUP_DIR/restore_instructions.txt << RESTORE_EOF
# 恢復指令：
# 1. 停止當前伺服器（如果有運行的話）
pkill -f "node.*server" 2>/dev/null

# 2. 解壓備份文件
cd /workspaces/
tar -xzf "$BACKUP_PATH"

# 3. 啟動伺服器
cd /workspaces/openclaw-core-
node server_rock.js &

echo "✅ 系統已從 $BACKUP_FILE 恢復"
RESTORE_EOF
  
  echo "恢復指令已儲存到: $BACKUP_DIR/restore_instructions.txt"
else
  echo "❌ 備份失敗！"
  exit 1
fi

# 顯示備份清單
echo ""
echo "=== 可用備份清單 ==="
ls -lh $BACKUP_DIR/openclaw-backup-*.tar.gz 2>/dev/null || echo "暫無其他備份"
