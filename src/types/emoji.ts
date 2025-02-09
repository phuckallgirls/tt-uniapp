// 基础表情类型
export interface Emoji {
    id: string;
    content: string;  // emoji 字符
}

// 最近使用的表情记录
export interface RecentEmoji {
    id: string;
    content: string;
    timestamp: number;
}

// 表情分类
export enum EmojiCategory {
    RECENT = 'recent',   // 最近使用
    EMOTION = 'emotion', // 表情
    GESTURE = 'gesture', // 手势
    SYMBOL = 'symbol'    // 符号
} 