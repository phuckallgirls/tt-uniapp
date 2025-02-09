/**
 * WebSocket 连接状态
 */
enum WSState {
    CONNECTING = 0,    // 连接中
    OPEN = 1,         // 已连接
    CLOSING = 2,      // 关闭中
    CLOSED = 3        // 已关闭
}

/**
 * WebSocket 管理类
 * 用于管理与 Flamingo Gateway 的 WebSocket 连接
 */
class WSManager {
    private static instance: WSManager;
    private ws: WebSocket | null = null;
    private url: string = '';
    private reconnectCount: number = 0;
    private maxReconnectCount: number = 3;
    private heartbeatTimer: number | null = null;
    private messageHandlers: Map<string, Function[]> = new Map();

    private constructor() {
        // 单例模式
    }

    public static getInstance(): WSManager {
        if (!WSManager.instance) {
            WSManager.instance = new WSManager();
        }
        return WSManager.instance;
    }

    /**
     * 初始化 WebSocket 连接
     */
    public init(url: string) {
        this.url = url;
        this.connect();
    }

    /**
     * 建立连接
     */
    private connect() {
        if (this.ws && this.ws.readyState === WSState.OPEN) {
            return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('WebSocket 连接成功');
            this.reconnectCount = 0;
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('消息解析失败:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket 连接关闭');
            this.stopHeartbeat();
            this.reconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 错误:', error);
            this.reconnect();
        };
    }

    /**
     * 重连
     */
    private reconnect() {
        if (this.reconnectCount >= this.maxReconnectCount) {
            console.error('WebSocket 重连次数超过限制');
            return;
        }

        this.reconnectCount++;
        console.log(`WebSocket 第 ${this.reconnectCount} 次重连`);
        
        setTimeout(() => {
            this.connect();
        }, 1000 * Math.pow(2, this.reconnectCount));
    }

    /**
     * 开始心跳
     */
    private startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.send('ping', {
                timestamp: Date.now()
            });
        }, 30000) as unknown as number;
    }

    /**
     * 停止心跳
     */
    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 发送消息
     */
    public send(type: string, data: any) {
        if (!this.ws || this.ws.readyState !== WSState.OPEN) {
            console.error('WebSocket 未连接');
            return;
        }

        const message = JSON.stringify({
            type,
            data,
            timestamp: Date.now()
        });

        this.ws.send(message);
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(message: any) {
        const { type, data } = message;
        const handlers = this.messageHandlers.get(type);
        
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`消息处理错误 [${type}]:`, error);
                }
            });
        }
    }

    /**
     * 注册消息处理器
     */
    public on(type: string, handler: Function) {
        const handlers = this.messageHandlers.get(type) || [];
        handlers.push(handler);
        this.messageHandlers.set(type, handlers);
    }

    /**
     * 移除消息处理器
     */
    public off(type: string, handler: Function) {
        const handlers = this.messageHandlers.get(type);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
            if (handlers.length === 0) {
                this.messageHandlers.delete(type);
            }
        }
    }

    /**
     * 关闭连接
     */
    public close() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const wsManager = WSManager.getInstance(); 