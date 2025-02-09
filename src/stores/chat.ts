import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Message, ChatSession } from '@/types/chat';
import { useUserStore } from './user';
import { useWebSocket } from '@/utils/websocket';
import { uploadFile } from '@/utils/upload';

// 聊天状态管理
export const useChatStore = defineStore('chat', () => {
    // WebSocket 实例
    const ws = useWebSocket();
    const userStore = useUserStore();

    // 状态定义
    const sessions = ref<ChatSession[]>([]); // 会话列表
    const messages = ref<{ [key: string]: Message[] }>({}); // 消息记录，key 为 sessionId
    const currentSessionId = ref<string>(''); // 当前会话 ID
    const loadingHistory = ref(false); // 是否正在加载历史消息

    // 计算属性
    const currentSession = computed(() => 
        sessions.value.find(s => s.id === currentSessionId.value)
    );

    const currentMessages = computed(() => 
        messages.value[currentSessionId.value] || []
    );

    const unreadCount = computed(() => 
        sessions.value.reduce((sum, session) => sum + (session.unread || 0), 0)
    );

    // 方法定义
    // 发送消息
    const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
        if (!currentSessionId.value) return;
        
        const message: Message = {
            id: Date.now().toString(), // 临时 ID
            sessionId: currentSessionId.value,
            senderId: userStore.userId,
            content,
            type,
            status: 'sending',
            timestamp: Date.now()
        };

        // 添加到消息列表
        addMessage(message);

        try {
            // 通过 WebSocket 发送消息
            await ws.send({
                type: 'chat_message',
                data: {
                    sessionId: currentSessionId.value,
                    content,
                    messageType: type
                }
            });

            // 更新消息状态为已发送
            updateMessageStatus(message.id, 'sent');
        } catch (error) {
            console.error('Send message error:', error);
            updateMessageStatus(message.id, 'failed');
        }
    };

    // 发送文件消息
    const sendFileMessage = async (file: File, type: 'image' | 'file') => {
        try {
            // 上传文件
            const fileUrl = await uploadFile(file);
            // 发送包含文件 URL 的消息
            await sendMessage(fileUrl, type);
        } catch (error) {
            console.error('Send file message error:', error);
            uni.showToast({
                title: '文件发送失败',
                icon: 'none'
            });
        }
    };

    // 加载历史消息
    const loadHistory = async (sessionId: string, pageSize = 20) => {
        if (loadingHistory.value) return;
        loadingHistory.value = true;

        try {
            const lastMessage = messages.value[sessionId]?.[0];
            const response = await ws.send({
                type: 'get_history',
                data: {
                    sessionId,
                    beforeId: lastMessage?.id,
                    limit: pageSize
                }
            });

            // 添加历史消息
            if (response.messages) {
                response.messages.forEach((msg: Message) => {
                    addMessage(msg, true); // true 表示添加到开头
                });
            }
        } catch (error) {
            console.error('Load history error:', error);
        } finally {
            loadingHistory.value = false;
        }
    };

    // 切换会话
    const switchSession = async (sessionId: string) => {
        currentSessionId.value = sessionId;
        // 如果没有消息记录，加载历史消息
        if (!messages.value[sessionId]) {
            messages.value[sessionId] = [];
            await loadHistory(sessionId);
        }
        // 清除未读计数
        clearUnread(sessionId);
    };

    // 添加消息
    const addMessage = (message: Message, toStart = false) => {
        if (!messages.value[message.sessionId]) {
            messages.value[message.sessionId] = [];
        }
        if (toStart) {
            messages.value[message.sessionId].unshift(message);
        } else {
            messages.value[message.sessionId].push(message);
        }
        // 更新会话最后一条消息
        updateSessionLastMessage(message);
    };

    // 更新消息状态
    const updateMessageStatus = (messageId: string, status: Message['status']) => {
        for (const sessionMessages of Object.values(messages.value)) {
            const message = sessionMessages.find(m => m.id === messageId);
            if (message) {
                message.status = status;
                break;
            }
        }
    };

    // 更新会话最后一条消息
    const updateSessionLastMessage = (message: Message) => {
        const session = sessions.value.find(s => s.id === message.sessionId);
        if (session) {
            session.lastMessage = message;
            session.lastMessageTime = message.timestamp;
            // 如果不是当前会话，增加未读计数
            if (message.sessionId !== currentSessionId.value && 
                message.senderId !== userStore.userId) {
                session.unread = (session.unread || 0) + 1;
            }
        }
    };

    // 清除未读计数
    const clearUnread = (sessionId: string) => {
        const session = sessions.value.find(s => s.id === sessionId);
        if (session) {
            session.unread = 0;
        }
    };

    // 处理收到的消息
    const handleReceivedMessage = (message: Message) => {
        addMessage(message);
        // 播放提示音等其他处理...
    };

    // WebSocket 消息处理
    ws.onMessage((data: any) => {
        if (data.type === 'chat_message') {
            handleReceivedMessage(data.message);
        }
    });

    return {
        sessions,
        currentSessionId,
        currentSession,
        currentMessages,
        unreadCount,
        loadingHistory,
        sendMessage,
        sendFileMessage,
        loadHistory,
        switchSession,
        clearUnread
    };
}); 