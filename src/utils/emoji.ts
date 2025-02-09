import type { Emoji, RecentEmoji } from '@/types/emoji';

// 基础表情数据
export const defaultEmojis: Emoji[] = [
    // 表情
    { id: 'smile', content: '😊' },
    { id: 'laugh', content: '😄' },
    { id: 'wink', content: '😉' },
    { id: 'cry', content: '😢' },
    { id: 'angry', content: '😠' },
    { id: 'surprised', content: '😮' },
    { id: 'cool', content: '😎' },
    { id: 'heart', content: '❤️' },
    { id: 'broken_heart', content: '💔' },
    { id: 'thumbs_up', content: '👍' },
    { id: 'thumbs_down', content: '👎' },
    { id: 'ok_hand', content: '👌' },
    { id: 'clap', content: '👏' },
    { id: 'wave', content: '👋' },
    { id: 'pray', content: '🙏' },
    // 符号
    { id: 'star', content: '⭐' },
    { id: 'sparkles', content: '✨' },
    { id: 'fire', content: '🔥' },
    { id: 'check', content: '✅' },
    { id: 'cross', content: '❌' }
];

// 最大最近使用表情数量
export const MAX_RECENT_EMOJIS = 8;

// 添加到最近使用
export const addToRecentEmojis = (emoji: Emoji, recentEmojis: RecentEmoji[]): RecentEmoji[] => {
    const newEmojis = [...recentEmojis];
    const index = newEmojis.findIndex(item => item.id === emoji.id);

    // 如果已存在，删除旧的
    if (index !== -1) {
        newEmojis.splice(index, 1);
    }

    // 添加到开头
    newEmojis.unshift({
        id: emoji.id,
        content: emoji.content,
        timestamp: Date.now()
    });

    // 保持最大数量限制
    if (newEmojis.length > MAX_RECENT_EMOJIS) {
        newEmojis.pop();
    }

    return newEmojis;
};

// 根据 ID 查找表情
export const findEmojiById = (id: string): Emoji | undefined => {
    return defaultEmojis.find(emoji => emoji.id === id);
}; 