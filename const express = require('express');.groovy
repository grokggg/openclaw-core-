const express = require('express');
const supabase = require('./config/supabase');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS中间件（允许所有来源，仅用于开发）
app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
          next();
});

// 路由
app.get('/', (req, res) => {
      res.json({
            message: '🚀 OpenClaw Core API 运行中',
                status: 'active',
                    version: '1.0.0',
                        endpoints: {
                                  health: '/health',
                                        test: '/test-db',
                                              setup: '/setup-tables',
                                                    status: '/system-status'
                        },
                            timestamp: new Date().toISOString(),
                                environment: process.env.NODE_ENV || 'development'
      });
});

// 健康检查
app.get('/health', (req, res) => {
      res.json({
            status: 'healthy',
                uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                        database: 'connected',
                            memory: process.memoryUsage()
      });
});

// 数据库连接测试
app.get('/test-db', async (req, res) => {
      try {
            const result = await require('./config/supabase').testConnection();
                
                    if (result.connected) {
                              res.json({
                                        success: true,
                                                message: '✅ Supabase数据库连接正常',
                                                        timestamp: new Date().toISOString(),
                                                                details: result
                              });
                    } else {
                              res.status(500).json({
                                        success: false,
                                                message: '❌ 数据库连接失败',
                                                        error: result.error?.message || '未知错误'
                              });
                    }
      } catch (error) {
            res.status(500).json({
                      success: false,
                            message: '❌ 测试过程中发生错误',
                                  error: error.message
            });
      }
});

// 系统状态
app.get('/system-status', (req, res) => {
      res.json({
            system: 'OpenClaw Core',
                status: 'operational',
                    version: '1.0.0',
                        environment: process.env.NODE_ENV || 'development',
                            uptime: `${Math.floor(process.uptime())}秒`,
                                memory: {
                                          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                                                total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
                                },
                                    endpoints: [
                                              { path: '/', method: 'GET', description: 'API信息' },
                                                    { path: '/health', method: 'GET', description: '健康检查' },
                                                          { path: '/test-db', method: 'GET', description: '数据库测试' },
                                                                { path: '/setup-tables', method: 'GET', description: '初始化数据库表' }
                                    ]
      });
});

// 404处理
app.use((req, res) => {
      res.status(404).json({
            error: '未找到路由',
                path: req.path,
                    method: req.method,
                        timestamp: new Date().toISOString()
      });
});

// 错误处理
app.use((err, req, res, next) => {
      console.error('❌ 服务器错误:', err);
        res.status(500).json({
                error: '服务器内部错误',
                    message: err.message,
                        timestamp: new Date().toISOString()
        });
});

// 启动服务器
const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
        console.log('🚀 OpenClaw Core 系统启动成功！');
          console.log('📡 服务器运行在:', `http://localhost:${PORT}`);
            console.log('📊 系统状态:', `http://localhost:${PORT}/system-status`);
              console.log('🔗 健康检查:', `http://localhost:${PORT}/health`);
                console.log('💾 数据库测试:', `http://localhost:${PORT}/test-db`);
                  console.log('='.repeat(50) + '\n');
                    
                      // 测试数据库连接
                        setTimeout(async () => {
                                console.log('🔌 测试数据库连接...');
                                    const result = await require('./config/supabase').testConnection();
                                        if (result.connected) {
                                                  console.log('✅ 数据库连接正常');
                                        } else {
                                                  console.log('❌ 数据库连接失败，请检查配置');
                                        }
                        }, 1000);
});

// 优雅关闭
process.on('SIGTERM', () => {
      console.log('🛑 收到关闭信号，正在关闭服务器...');
        server.close(() => {
                console.log('✅ 服务器已关闭');
                    process.exit(0);
        });
});

module.exports = app;

        })
})
                                        }
                                        }
                        })
})
        })
})
      })
})
                                    ]
                                }
      })
})
            })
      }
                              })
                    }
                              })
                    }
      }
})
      })
})
                        }
      })
})
})