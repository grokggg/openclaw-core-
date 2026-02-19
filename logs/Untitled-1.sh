#!/bin/bash

# OpenClaw智能体系统启动脚本
# 功能：解决端口冲突，启动OpenClaw核心引擎

set -e  # 遇到错误立即退出

echo "=========================================="
echo "🚀 OpenClaw智能体系统启动脚本"
echo "=========================================="

# 配置变量
PORT=3002
PROJECT_DIR="/workspaces/openclaw-core-"
LOG_FILE="$PROJECT_DIR/logs/server.log"
PID_FILE="$PROJECT_DIR/server.pid"

# 确保在项目目录
cd "$PROJECT_DIR" || { echo "❌ 无法进入项目目录: $PROJECT_DIR"; exit 1; }

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

echo "🔧 当前目录: $(pwd)"
echo "📡 目标端口: $PORT"
echo "📁 日志文件: $LOG_FILE"

# 函数：检查端口是否被占用
check_port() {
        echo "🔍 检查端口 $PORT 占用情况..."
            if lsof -ti:$PORT > /dev/null 2>&1; then
                    echo "⚠️  端口 $PORT 被以下进程占用:"
                            lsof -ti:$PORT | xargs ps -p 2>/dev/null || true
                                    return 0
                                        else
                                                echo "✅ 端口 $PORT 可用"
                                                        return 1
                                                            fi
}

# 函数：释放端口
free_port() {
        echo "🛑 尝试释放端口 $PORT..."
            
                # 方法1: 使用fuser
                    if command -v fuser > /dev/null 2>&1; then
                            sudo fuser -k $PORT/tcp 2>/dev/null || true
                                fi
                                    
                                        # 方法2: 使用lsof
                                            if lsof -ti:$PORT > /dev/null 2>&1; then
                                                    echo "⏳ 终止占用端口进程..."
                                                            lsof -ti:$PORT | xargs sudo kill -9 2>/dev/null || true
                                                                    sleep 2
                                                                        fi
                                                                            
                                                                                # 方法3: 杀死可能的Node.js进程
                                                                                    echo "⏳ 清理Node.js进程..."
                                                                                        sudo pkill -f "node.*index.js" 2>/dev/null || true
                                                                                            sudo pkill -f "node.*3002" 2>/dev/null || true
                                                                                                
                                                                                                    # 再次检查
                                                                                                        if check_port; then
                                                                                                                echo "❌ 无法完全释放端口 $PORT，请手动检查"
                                                                                                                        echo "   运行: sudo lsof -i :$PORT"
                                                                                                                                return 1
                                                                                                                                    else
                                                                                                                                            echo "✅ 端口 $PORT 已成功释放"
                                                                                                                                                    return 0
                                                                                                                                                        fi
}

# 函数：检查数据库连接
check_database() {
        echo "🔍 检查数据库连接..."
            
                # 从.env文件读取配置
                    if [ -f .env ]; then
                            source .env
                                fi
                                    
                                        if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
                                                echo "⚠️  未找到数据库配置，请检查.env文件"
                                                        return 1
                                                            fi
                                                                
                                                                    # 测试数据库连接
                                                                        echo "⏳ 测试Supabase连接..."
                                                                            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
                                                                                    -H "apikey: $SUPABASE_KEY" \
                                                                                            -H "Authorization: Bearer $SUPABASE_KEY" \
                                                                                                    "$SUPABASE_URL/rest/v1/ops_reaction_matrix?select=count" 2>/dev/null || echo "000")
                                                                                                        
                                                                                                            if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "201" ] || [ "$RESPONSE" = "204" ]; then
                                                                                                                    echo "✅ 数据库连接正常 (HTTP $RESPONSE)"
                                                                                                                            return 0
                                                                                                                                else
                                                                                                                                        echo "⚠️  数据库连接可能有问题 (HTTP $RESPONSE)"
                                                                                                                                                echo "   请检查:"
                                                                                                                                                        echo "   1. .env文件中的SUPABASE_URL和SUPABASE_KEY"
                                                                                                                                                                echo "   2. 网络连接"
                                                                                                                                                                        echo "   3. Supabase项目状态"
                                                                                                                                                                                return 1
                                                                                                                                                                                    fi
}

# 函数：检查表结构
check_table_structure() {
        echo "🔍 检查数据库表结构..."
            
                if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
                        echo "⚠️  无法检查表结构，缺少数据库配置"
                                return
                                    fi
                                        
                                            # 检查ops_events表的event_id列类型
                                                echo "⏳ 检查ops_events表结构..."
                                                    RESPONSE=$(curl -s \
                                                            -H "apikey: $SUPABASE_KEY" \
                                                                    -H "Authorization: Bearer $SUPABASE_KEY" \
                                                                            "$SUPABASE_URL/rest/v1/ops_events?select=event_id&limit=1" 2>&1)
                                                                                
                                                                                    if echo "$RESPONSE" | grep -q "event_id"; then
                                                                                            echo "✅ ops_events表包含event_id列"
                                                                                                else
                                                                                                        echo "⚠️  ops_events表可能缺少event_id列或类型不匹配"
                                                                                                                echo "   请在Supabase中执行:"
                                                                                                                        echo "   ALTER TABLE ops_events ALTER COLUMN event_id TYPE TEXT;"
                                                                                                                            fi
}

# 函数：启动服务器
start_server() {
        echo "🚀 启动OpenClaw服务器..."
            
                # 检查Node.js和npm
                    if ! command -v node > /dev/null 2>&1; then
                            echo "❌ Node.js未安装"
                                    exit 1
                                        fi
                                            
                                                if ! command -v npm > /dev/null 2>&1; then
                                                        echo "❌ npm未安装"
                                                                exit 1
                                                                    fi
                                                                        
                                                                            echo "📦 Node.js版本: $(node --version)"
                                                                                echo "📦 npm版本: $(npm --version)"
                                                                                    
                                                                                        # 安装依赖（如果需要）
                                                                                            if [ ! -d "node_modules" ]; then
                                                                                                    echo "📥 安装依赖..."
                                                                                                            npm install
                                                                                                                fi
                                                                                                                    
                                                                                                                        # 检查index.js是否存在
                                                                                                                            if [ ! -f "index.js" ]; then
                                                                                                                                    echo "❌ 找不到index.js文件"
                                                                                                                                            exit 1
                                                                                                                                                fi
                                                                                                                                                    
                                                                                                                                                        # 启动服务器
                                                                                                                                                            echo "⚡ 启动服务器进程..."
                                                                                                                                                                echo "   日志输出: $LOG_FILE"
                                                                                                                                                                    echo "   访问地址: http://localhost:$PORT"
                                                                                                                                                                        echo "   健康检查: http://localhost:$PORT/health"
                                                                                                                                                                            echo "   按 Ctrl+C 停止服务器"
                                                                                                                                                                                echo "=========================================="
                                                                                                                                                                                    
                                                                                                                                                                                        # 保存PID
                                                                                                                                                                                            nohup node index.js > "$LOG_FILE" 2>&1 &
                                                                                                                                                                                                SERVER_PID=$!
                                                                                                                                                                                                    echo $SERVER_PID > "$PID_FILE"
                                                                                                                                                                                                        
                                                                                                                                                                                                            echo "📌 服务器PID: $SERVER_PID"
                                                                                                                                                                                                                echo "📌 PID已保存到: $PID_FILE"
                                                                                                                                                                                                                    
                                                                                                                                                                                                                        # 等待服务器启动
                                                                                                                                                                                                                            echo "⏳ 等待服务器启动..."
                                                                                                                                                                                                                                sleep 5
                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                        # 检查服务器是否运行
                                                                                                                                                                                                                                            if ps -p $SERVER_PID > /dev/null 2>&1; then
                                                                                                                                                                                                                                                    echo "✅ 服务器启动成功 (PID: $SERVER_PID)"
                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                    # 测试健康检查
                                                                                                                                                                                                                                                                            if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                                                                                                                                                                                                                                                                                        echo "✅ 健康检查通过"
                                                                                                                                                                                                                                                                                                    echo "=========================================="
                                                                                                                                                                                                                                                                                                                echo "🎉 OpenClaw系统启动完成！"
                                                                                                                                                                                                                                                                                                                            echo "=========================================="
                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                    # 显示日志尾部
                                                                                                                                                                                                                                                                                                                                                                echo "📄 最近日志:"
                                                                                                                                                                                                                                                                                                                                                                            tail -10 "$LOG_FILE"
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                    # 显示可用端点
                                                                                                                                                                                                                                                                                                                                                                                                                echo ""
                                                                                                                                                                                                                                                                                                                                                                                                                            echo "🌐 可用端点:"
                                                                                                                                                                                                                                                                                                                                                                                                                                        echo "   http://localhost:$PORT/              - 系统信息"
                                                                                                                                                                                                                                                                                                                                                                                                                                                    echo "   http://localhost:$PORT/health        - 健康检查"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                echo "   http://localhost:$PORT/api/engine/   - 引擎控制"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            echo ""
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        echo "🔧 管理命令:"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    echo "   查看日志: tail -f $LOG_FILE"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                echo "   停止服务器: ./start_openclaw.sh stop"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        else
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    echo "⚠️  服务器已启动但健康检查失败"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                echo "   查看日志: tail -f $LOG_FILE"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        fi
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            else
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    echo "❌ 服务器启动失败"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            echo "   查看日志: tail -20 $LOG_FILE"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    exit 1
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        fi
}

# 函数：停止服务器
stop_server() {
        echo "🛑 停止OpenClaw服务器..."
            
                if [ -f "$PID_FILE" ]; then
                        SERVER_PID=$(cat "$PID_FILE")
                                if ps -p $SERVER_PID > /dev/null 2>&1; then
                                            echo "⏳ 停止进程 $SERVER_PID..."
                                                        kill $SERVER_PID 2>/dev/null || true
                                                                    sleep 2
                                                                                
                                                                                            if ps -p $SERVER_PID > /dev/null 2>&1; then
                                                                                                            echo "⏳ 强制停止进程 $SERVER_PID..."
                                                                                                                            kill -9 $SERVER_PID 2>/dev/null || true
                                                                                                                                        fi
                                                                                                                                                fi
                                                                                                                                                        rm -f "$PID_FILE"
                                                                                                                                                            fi
                                                                                                                                                                
                                                                                                                                                                    # 清理端口
                                                                                                                                                                        free_port
                                                                                                                                                                            
                                                                                                                                                                                echo "✅ 服务器已停止"
}

# 函数：查看状态
show_status() {
        echo "📊 OpenClaw系统状态"
            echo "=========================================="
                
                    # 检查服务器进程
                        if [ -f "$PID_FILE" ]; then
                                SERVER_PID=$(cat "$PID_FILE")
                                        if ps -p $SERVER_PID > /dev/null 2>&1; then
                                                    echo "✅ 服务器运行中 (PID: $SERVER_PID)"
                                                                
                                                                            # 检查健康
                                                                                        if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                                                                                                        echo "✅ 健康检查: 正常"
                                                                                                                        echo "🌐 访问地址: http://localhost:$PORT"
                                                                                                                                    else
                                                                                                                                                    echo "⚠️  健康检查: 失败"
                                                                                                                                                                fi
                                                                                                                                                                        else
                                                                                                                                                                                    echo "❌ 服务器未运行 (PID文件存在但进程不存在)"
                                                                                                                                                                                                rm -f "$PID_FILE"
                                                                                                                                                                                                        fi
                                                                                                                                                                                                            else
                                                                                                                                                                                                                    echo "❌ 服务器未运行"
                                                                                                                                                                                                                        fi
                                                                                                                                                                                                                            
                                                                                                                                                                                                                                # 检查端口
                                                                                                                                                                                                                                    check_port
                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                            # 显示日志大小
                                                                                                                                                                                                                                                if [ -f "$LOG_FILE" ]; then
                                                                                                                                                                                                                                                        LOG_SIZE=$(wc -l < "$LOG_FILE")
                                                                                                                                                                                                                                                                echo "📄 日志文件: $LOG_FILE (${LOG_SIZE}行)"
                                                                                                                                                                                                                                                                    fi
                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                            # 显示引擎状态
                                                                                                                                                                                                                                                                                if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                                                                                                                                                                                                                                                                                        echo "🔧 引擎状态:"

}curl -s http://localhost:$PORT/api/engine/status | grep -o '"status":"[^"]*"' | head -1 || echo "   无法获取引擎状态"
    fi
    }
    
    # 主程序
    case "${1:-start}" in
        start)
                # 检查并释放端口
                        if check_port; then
                                    free_port || exit 1
                                            fi
                                                    
                                                            # 检查数据库
                                                                    check_database || echo "⚠️  继续启动，但数据库可能有问题"
                                                                            
                                                                                    # 检查表结构
                                                                                            check_table_structure
                                                                                                    
                                                                                                            # 启动服务器
                                                                                                                    start_server
                                                                                                                            ;;
                                                                                                                                
                                                                                                                                    stop)
                                                                                                                                            stop_server
                                                                                                                                                    ;;
                                                                                                                                                        
                                                                                                                                                            restart)
                                                                                                                                                                    echo "🔄 重启OpenClaw服务器..."
                                                                                                                                                                            stop_server
                                                                                                                                                                                    sleep 2
                                                                                                                                                                                            check_table_structure
                                                                                                                                                                                                    start_server
                                                                                                                                                                                                            ;;
                                                                                                                                                                                                                
                                                                                                                                                                                                                    status)
                                                                                                                                                                                                                            show_status
                                                                                                                                                                                                                                    ;;
                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                            logs)
                                                                                                                                                                                                                                                    echo "📄 显示服务器日志 (最后50行):"
                                                                                                                                                                                                                                                            if [ -f "$LOG_FILE" ]; then
                                                                                                                                                                                                                                                                        tail -50 "$LOG_FILE"
                                                                                                                                                                                                                                                                                else']'
}
}echo "日志文件不存在: $LOG_FILE"
        fi
                ;;
                    
                        monitor)
                                echo "👀 实时监控日志 (Ctrl+C退出):"
                                        if [ -f "$LOG_FILE" ]; then
                                                    tail -f "$LOG_FILE"
                                                            else
                                                                        echo "日志文件不存在: $LOG_FILE"
                                                                                fi
                                                                                        ;;
                                                                                            
                                                                                                help|--help|-h)
                                                                                                        echo "使用方法: $0 {start|stop|restart|status|logs|monitor|help}"
                                                                                                                echo ""
                                                                                                                        echo "命令:"
                                                                                                                                echo "  start    启动OpenClaw服务器 (默认)"
                                                                                                                                        echo "  stop     停止服务器"
                                                                                                                                                echo "  restart  重启服务器"
                                                                                                                                                        echo "  status   显示系统状态"
                                                                                                                                                                echo "  logs     查看日志"
                                                                                                                                                                        echo "  monitor  实时监控日志"
                                                                                                                                                                                echo "  help     显示此帮助信息"
                                                                                                                                                                                        echo ""
                                                                                                                                                                                                echo "示例:"
                                                                                                                                                                                                        echo "  $0 start      # 启动服务器"
                                                                                                                                                                                                                echo "  $0 status     # 查看状态"
                                                                                                                                                                                                                        echo "  $0 logs       # 查看日志"
                                                                                                                                                                                                                                echo "  $0 monitor    # 实时监控"
                                                                                                                                                                                                                                        ;;
                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                *)
                                                                                                                                                                                                                                                        echo "❌ 未知命令: $1"
                                                                                                                                                                                                                                                                echo "   使用: $0 help 查看可用命令"
                                                                                                                                                                                                                                                                        exit 1
                                                                                                                                                                                                                                                                                ;;
}
}
}