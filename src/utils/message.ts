import type { MessageType, ChatMessage } from '@/types/message';
import { wsManager } from './websocket';

/**
 * 消息处理工具类
 */
export class MessageManager {
    private static instance: MessageManager;
    private messageCallbacks: Map<string, Function[]> = new Map();

    private constructor() {
        this.initMessageHandlers();
    }

    public static getInstance(): MessageManager {
        if (!MessageManager.instance) {
            MessageManager.instance = new MessageManager();
        }
        return MessageManager.instance;
    }

    /**
     * 初始化消息处理器
     */
    private initMessageHandlers() {
        // 处理文本消息
        wsManager.on('msg.text', this.handleTextMessage.bind(this));
        // 处理图片消息
        wsManager.on('msg.image', this.handleImageMessage.bind(this));
        // 处理语音消息
        wsManager.on('msg.voice', this.handleVoiceMessage.bind(this));
        // 处理视频消息
        wsManager.on('msg.video', this.handleVideoMessage.bind(this));
        // 处理文件消息
        wsManager.on('msg.file', this.handleFileMessage.bind(this));
        // 处理系统消息
        wsManager.on('msg.system', this.handleSystemMessage.bind(this));
        // 处理消息状态更新
        wsManager.on('msg.status', this.handleMessageStatus.bind(this));
        // 处理消息撤回
        wsManager.on('msg.recall', this.handleMessageRecall.bind(this));
    }

    /**
     * 发送消息
     */
    public async sendMessage(message: ChatMessage): Promise<boolean> {
        try {
            const msgType = this.getMessageType(message.type);
            wsManager.send(`msg.${msgType}`, {
                id: message.id,
                from: message.from,
                to: message.to,
                chatType: message.chatType,
                content: message.content,
                timestamp: Date.now()
            });
            return true;
        } catch (error) {
            console.error('发送消息失败:', error);
            return false;
        }
    }

    /**
     * 撤回消息
     */
    public recallMessage(messageId: string, chatId: string): Promise<boolean> {
        return new Promise((resolve) => {
            wsManager.send('msg.recall', {
                messageId,
                chatId,
                timestamp: Date.now()
            });
            resolve(true);
        });
    }

    /**
     * 获取消息类型字符串
     */
    private getMessageType(type: MessageType): string {
        const typeMap: Record<MessageType, string> = {
            [MessageType.TEXT]: 'text',
            [MessageType.IMAGE]: 'image',
            [MessageType.VOICE]: 'voice',
            [MessageType.VIDEO]: 'video',
            [MessageType.FILE]: 'file',
            [MessageType.SYSTEM]: 'system'
        };
        return typeMap[type];
    }

    /**
     * 处理文本消息
     */
    private handleTextMessage(data: any) {
        const message: ChatMessage = {
            id: data.id,
            type: MessageType.TEXT,
            from: data.from,
            to: data.to,
            chatType: data.chatType,
            content: data.content,
            timestamp: data.timestamp,
            status: 'received'
        };
        this.notifyMessageHandlers('onMessage', message);
    }

    /**
     * 处理图片消息
     */
    private handleImageMessage(data: any) {
        const message: ChatMessage = {
            id: data.id,
            type: MessageType.IMAGE,
            from: data.from,
            to: data.to,
            chatType: data.chatType,
            content: {
                url: data.content.url,
                thumbnail: data.content.thumbnail,
                width: data.content.width,
                height: data.content.height,
                size: data.content.size
            },
            timestamp: data.timestamp,
            status: 'received'
        };
        this.notifyMessageHandlers('onMessage', message);
    }

    /**
     * 处理语音消息
     */
    private handleVoiceMessage(data: any) {
        const message: ChatMessage = {
            id: data.id,
            type: MessageType.VOICE,
            from: data.from,
            to: data.to,
            chatType: data.chatType,
            content: {
                url: data.content.url,
                duration: data.content.duration,
                size: data.content.size
            },
            timestamp: data.timestamp,
            status: 'received'
        };
        this.notifyMessageHandlers('onMessage', message);
    }

    /**
     * 处理视频消息
     */
    private handleVideoMessage(data: any) {
        const message: ChatMessage = {
            id: data.id,
            type: MessageType.VIDEO,
            from: data.from,
            to: data.to,
            chatType: data.chatType,
            content: {
                url: data.content.url,
                thumbnail: data.content.thumbnail,
                duration: data.content.duration,
                size: data.content.size
            },
            timestamp: data.timestamp,
            status: 'received'
        };
        this.notifyMessageHandlers('onMessage', message);
    }

    /**
     * 处理文件消息
     */
    private handleFileMessage(data: any) {
        const message: ChatMessage = {
            id: data.id,
            type: MessageType.FILE,
            from: data.from,
            to: data.to,
            chatType: data.chatType,
            content: {
                url: data.content.url,
                name: data.content.name,
                size: data.content.size,
                ext: data.content.ext
            },
            timestamp: data.timestamp,
            status: 'received'
        };
        this.notifyMessageHandlers('onMessage', message);
    }

    /**
     * 处理系统消息
     */
    private handleSystemMessage(data: any) {
        const message: ChatMessage = {
            id: data.id,
            type: MessageType.SYSTEM,
            from: data.from,
            to: data.to,
            chatType: data.chatType,
            content: data.content,
            timestamp: data.timestamp,
            status: 'received'
        };
        this.notifyMessageHandlers('onMessage', message);
    }

    /**
     * 处理消息状态更新
     */
    private handleMessageStatus(data: any) {
        this.notifyMessageHandlers('onMessageStatus', {
            messageId: data.messageId,
            status: data.status
        });
    }

    /**
     * 处理消息撤回
     */
    private handleMessageRecall(data: any) {
        this.notifyMessageHandlers('onMessageRecall', {
            messageId: data.messageId,
            chatId: data.chatId
        });
    }

    /**
     * 注册消息处理回调
     */
    public on(event: string, callback: Function) {
        const callbacks = this.messageCallbacks.get(event) || [];
        callbacks.push(callback);
        this.messageCallbacks.set(event, callbacks);
    }

    /**
     * 移除消息处理回调
     */
    public off(event: string, callback: Function) {
        const callbacks = this.messageCallbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
            if (callbacks.length === 0) {
                this.messageCallbacks.delete(event);
            }
        }
    }

    /**
     * 通知消息处理器
     */
    private notifyMessageHandlers(event: string, data: any) {
        const callbacks = this.messageCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`消息处理回调错误 [${event}]:`, error);
                }
            });
        }
    }
}

export const messageManager = MessageManager.getInstance(); 