/**
 * 消息类型
 */
export enum MessageType {
    TEXT = 1,      // 文本消息
    IMAGE = 2,     // 图片消息
    VOICE = 3,     // 语音消息
    VIDEO = 4,     // 视频消息
    FILE = 5,      // 文件消息
    SYSTEM = 6     // 系统消息
}

/**
 * 聊天类型
 */
export enum ChatType {
    SINGLE = 1,    // 单聊
    GROUP = 2      // 群聊
}

/**
 * 消息状态
 */
export type MessageStatus = 'sending' | 'sent' | 'received' | 'read' | 'failed';

/**
 * 基础消息接口
 */
export interface BaseMessage {
    id: string;                // 消息ID
    type: MessageType;         // 消息类型
    from: number;              // 发送者ID
    to: string;               // 接收者ID（用户ID或群组ID）
    chatType: ChatType;        // 聊天类型
    timestamp: number;         // 发送时间戳
    status: MessageStatus;     // 消息状态
}

/**
 * 文本消息
 */
export interface TextMessage extends BaseMessage {
    type: MessageType.TEXT;
    content: string;           // 文本内容
}

/**
 * 图片消息
 */
export interface ImageMessage extends BaseMessage {
    type: MessageType.IMAGE;
    content: {
        url: string;          // 图片URL
        thumbnail: string;    // 缩略图URL
        width: number;        // 图片宽度
        height: number;       // 图片高度
        size: number;         // 文件大小
    };
}

/**
 * 语音消息
 */
export interface VoiceMessage extends BaseMessage {
    type: MessageType.VOICE;
    content: {
        url: string;          // 语音URL
        duration: number;     // 语音时长（秒）
        size: number;         // 文件大小
    };
}

/**
 * 视频消息
 */
export interface VideoMessage extends BaseMessage {
    type: MessageType.VIDEO;
    content: {
        url: string;          // 视频URL
        thumbnail: string;    // 视频封面URL
        duration: number;     // 视频时长（秒）
        size: number;         // 文件大小
    };
}

/**
 * 文件消息
 */
export interface FileMessage extends BaseMessage {
    type: MessageType.FILE;
    content: {
        url: string;          // 文件URL
        name: string;         // 文件名
        size: number;         // 文件大小
        ext: string;          // 文件扩展名
    };
}

/**
 * 系统消息
 */
export interface SystemMessage extends BaseMessage {
    type: MessageType.SYSTEM;
    content: {
        action: string;       // 系统消息动作
        data: any;           // 系统消息数据
    };
}

/**
 * 聊天消息联合类型
 */
export type ChatMessage = TextMessage | ImageMessage | VoiceMessage | VideoMessage | FileMessage | SystemMessage;

/**
 * 最近聊天
 */
export interface RecentChat {
    id: string;               // 聊天ID（用户ID或群组ID）
    type: ChatType;           // 聊天类型
    name: string;             // 聊天名称
    avatar: string;           // 头像
    lastMessage: ChatMessage; // 最后一条消息
    unreadCount: number;      // 未读消息数
    timestamp: number;        // 最后消息时间
    sticky?: boolean;         // 是否置顶
    muted?: boolean;          // 是否静音
}

export interface MessageCache {
  id: string
  localPath: string
  createTime: number
  expireTime: number
}

export interface MessagePage {
  pageSize: number
  currentPage: number
  hasMore: boolean
} 