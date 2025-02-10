import config from '../config'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'

class WebSocket {
  private static instance: WebSocket
  private ws: UniApp.SocketTask | null = null
  private status: 'connecting' | 'connected' | 'closed' = 'closed'
  private reconnectCount = 0
  private heartbeatTimer: number | null = null

  private constructor() {
    // 监听网络状态
    uni.onNetworkStatusChange(res => {
      if (res.isConnected && this.status === 'closed') {
        this.connect()
      }
    })
  }

  static getInstance(): WebSocket {
    if (!WebSocket.instance) {
      WebSocket.instance = new WebSocket()
    }
    return WebSocket.instance
  }

  connect() {
    if (this.status === 'connecting' || this.status === 'connected') {
      return
    }

    this.status = 'connecting'
    
    const userStore = useUserStore()
    if (!userStore.token) {
      console.error('WebSocket连接失败：未登录')
      return
    }

    this.ws = uni.connectSocket({
      url: `${config.ws.url}?token=${userStore.token}`,
      complete: () => {}
    })

    this.ws.onOpen(() => this.onOpen())
    this.ws.onClose(() => this.onClose())
    this.ws.onError(() => this.onError())
    this.ws.onMessage(res => this.onMessage(res))
  }

  private reconnect() {
    if (this.reconnectCount >= config.ws.maxReconnectAttempts) {
      console.error('WebSocket重连失败：超过最大重试次数')
      return
    }

    this.reconnectCount++
    console.log(`WebSocket重连中... (${this.reconnectCount}/${config.ws.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, config.ws.reconnectInterval)
  }

  private onOpen() {
    console.log('WebSocket连接成功')
    this.status = 'connected'
    this.reconnectCount = 0
    this.startHeartbeat()
  }

  private onClose() {
    console.log('WebSocket连接关闭')
    this.status = 'closed'
    this.stopHeartbeat()
    this.reconnect()
  }

  private onError() {
    console.error('WebSocket连接错误')
    this.status = 'closed'
    this.stopHeartbeat()
    this.reconnect()
  }

  private onMessage(res: UniApp.OnSocketMessageCallbackResult) {
    try {
      const data = JSON.parse(res.data as string)
      
      // 处理心跳响应
      if (data.type === 'pong') {
        return
      }
      
      // 使用 chat store 处理消息
      console.log('收到消息:', data)
      const chatStore = useChatStore()
      chatStore.handleReceivedMessage(data)
    } catch (e) {
      console.error('WebSocket消息解析失败:', e)
    }
  }

  send(data: any) {
    if (this.status !== 'connected') {
      console.error('WebSocket未连接')
      return
    }

    try {
      this.ws?.send({
        data: JSON.stringify(data)
      })
    } catch (e) {
      console.error('WebSocket消息发送失败:', e)
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' })
    }, config.ws.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  close() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close({})
      this.ws = null
    }
    this.status = 'closed'
  }
}

export const websocket = WebSocket.getInstance()
