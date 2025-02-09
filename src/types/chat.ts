/**
 * 会话类型
 */
export enum ChatType {
    SINGLE = 1,    // 单聊
    GROUP = 2      // 群聊
}

/**
 * 消息类型
 */
export enum MessageType {
    TEXT = 1,      // 文本
    IMAGE = 2,     // 图片
    FILE = 3,      // 文件
    AUDIO = 4,     // 语音
    VIDEO = 5      // 视频
}

/**
 * 会话项接口
 */
export interface ChatSession {
    id: string;                // 会话ID
    type: ChatType;           // 会话类型
    name: string;             // 会话名称
    avatar: string;           // 头像
    lastMessage: string;      // 最后一条消息
    lastMessageType: MessageType; // 最后一条消息类型
    lastMessageTime: number;  // 最后一条消息时间
    unreadCount: number;      // 未读消息数
    online?: boolean;         // 在线状态（单聊时有效）
} 