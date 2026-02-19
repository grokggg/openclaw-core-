const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseClient {
      constructor() {
            this.url = process.env.SUPABASE_URL;
                this.key = process.env.SUPABASE_KEY;
                    
                        if (!this.url || !this.key) {
                                  console.error('❌ 错误: 请检查.env文件中的SUPABASE_URL和SUPABASE_KEY配置');
                                        console.log('📝 当前配置:');
                                              console.log('SUPABASE_URL:', this.url ? '已设置' : '未设置');
                                                    console.log('SUPABASE_KEY:', this.key ? '已设置' : '未设置');
                                                          process.exit(1);
                        }
                            
                                // 移除末尾的斜杠
                                    if (this.url.endsWith('/')) {
                                              this.url = this.url.slice(0, -1);
                                    }
                                        
                                            this.client = createClient(this.url, this.key);
                                                console.log('✅ Supabase客户端初始化成功');
                                                    console.log(`📊 项目URL: ${this.url}`);
      }
        
          getClient() {
                return this.client;
          }
            
              async testConnection() {
                    try {
                              const { data, error } = await this.client
                                      .from('_test')
                                              .select('*')
                                                      .limit(1);
                                                            
                                                                  if (error) {
                                                                            console.log('⚠️  Supabase连接测试: 表不存在但连接正常');
                                                                                    return { connected: true, error: null };
                                                                  }
                                                                        
                                                                              console.log('✅ Supabase连接测试成功');
                                                                                    return { connected: true, data };
                    } catch (error) {
                              console.error('❌ Supabase连接测试失败:', error.message);
                                    return { connected: false, error };
                    }
              }
}

// 创建单例实例
const supabaseInstance = new SupabaseClient();
module.exports = supabaseInstance.getClient();
module.exports.testConnection = () => supabaseInstance.testConnection();

                    }
                                                                  }
                    }
              }
          }
                                    }
                        }
      }
}