import env from './env'

const currentEnv = process.env.NODE_ENV || 'development'
const envConfig = env[currentEnv]

export default {
  // 环境
  env: currentEnv,
  
  // WebSocket配置
  ws: {
    url: envConfig.WS_URL,
    heartbeatInterval: 30000,  // 心跳间隔，30秒
    reconnectInterval: 3000,   // 重连间隔，3秒
    maxReconnectAttempts: 5    // 最大重连次数
  },
  
  // HTTP API配置
  api: {
    baseUrl: envConfig.API_URL,
    timeout: 10000  // 请求超时时间，10秒
  },
  
  // 存储键名
  storage: {
    token: 'tt_token',
    userInfo: 'tt_user_info',
    settings: 'tt_settings'
  }
}
