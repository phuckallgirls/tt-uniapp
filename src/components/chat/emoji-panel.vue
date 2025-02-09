<template>
    <view class="emoji-panel">
        <!-- 表情分类标签 -->
        <view class="category-tabs">
            <view 
                v-for="category in categories"
                :key="category.id"
                class="tab-item"
                :class="{ active: currentCategory === category.id }"
                @tap="handleCategoryChange(category.id)"
            >
                <text class="iconfont" :class="category.icon"></text>
            </view>
        </view>

        <!-- 表情内容区 -->
        <view class="emoji-content">
            <!-- 最近使用的表情 -->
            <view v-if="currentCategory === 'recent'" class="emoji-grid">
                <view 
                    v-for="emoji in recentEmojis"
                    :key="emoji.id"
                    class="emoji-item"
                    @tap="handleEmojiSelect(emoji)"
                >
                    {{ emoji.content }}
                </view>
                <view 
                    v-if="recentEmojis.length === 0"
                    class="empty-tip"
                >
                    暂无最近使用的表情
                </view>
            </view>

            <!-- 默认表情列表 -->
            <view v-else class="emoji-grid">
                <view 
                    v-for="emoji in defaultEmojis"
                    :key="emoji.id"
                    class="emoji-item"
                    @tap="handleEmojiSelect(emoji)"
                >
                    {{ emoji.content }}
                </view>
                <!-- 删除按钮 -->
                <view 
                    class="emoji-item delete"
                    @tap="handleDelete"
                >
                    <text class="iconfont icon-delete"></text>
                </view>
            </view>
        </view>

        <!-- 发送按钮 -->
        <view class="send-bar">
            <button 
                class="send-button"
                :class="{ active: inputText }"
                @tap="handleSend"
            >
                发送
            </button>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStorage } from '@/utils/storage';
import { EmojiCategory, type Emoji, type RecentEmoji } from '@/types/emoji';
import { defaultEmojis, addToRecentEmojis, MAX_RECENT_EMOJIS } from '@/utils/emoji';

// 组件属性定义
const props = defineProps<{
    inputText?: string; // 输入框文本，用于控制发送按钮状态
}>();

// 事件定义
const emit = defineEmits<{
    (e: 'select', emoji: string): void;  // 选择表情时触发
    (e: 'delete'): void;                 // 点击删除按钮时触发
    (e: 'send'): void;                   // 点击发送按钮时触发
}>();

// 表情分类定义
const categories = [
    { id: EmojiCategory.RECENT, icon: 'icon-recent', name: '最近' },
    { id: EmojiCategory.EMOTION, icon: 'icon-emoji', name: '表情' }
];

// 状态管理
const currentCategory = ref<EmojiCategory>(EmojiCategory.EMOTION);
const recentEmojis = ref<RecentEmoji[]>([]);
const storage = useStorage();

// 初始化最近使用的表情
const initRecentEmojis = () => {
    const stored = storage.get<RecentEmoji[]>('recentEmojis');
    if (stored) {
        recentEmojis.value = stored;
    }
};

// 切换表情分类
const handleCategoryChange = (category: EmojiCategory) => {
    currentCategory.value = category;
};

// 选择表情
const handleEmojiSelect = (emoji: Emoji) => {
    // 添加到最近使用
    recentEmojis.value = addToRecentEmojis(emoji, recentEmojis.value);
    storage.set('recentEmojis', recentEmojis.value);
    
    // 触发选择事件
    emit('select', emoji.content);
};

// 删除按钮处理
const handleDelete = () => {
    emit('delete');
};

// 发送按钮处理
const handleSend = () => {
    if (props.inputText) {
        emit('send');
    }
};

// 初始化
initRecentEmojis();
</script>

<style lang="scss">
.emoji-panel {
    height: 460rpx;
    background-color: #fff;
    display: flex;
    flex-direction: column;

    // 分类标签样式
    .category-tabs {
        height: 80rpx;
        display: flex;
        border-bottom: 2rpx solid #f5f6fa;
        padding: 0 20rpx;

        .tab-item {
            width: 80rpx;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            .iconfont {
                font-size: 40rpx;
                color: #636e72;
            }

            &.active {
                position: relative;
                
                .iconfont {
                    color: #6c5ce7;
                }

                &::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40rpx;
                    height: 4rpx;
                    background-color: #6c5ce7;
                    border-radius: 2rpx;
                }
            }
        }
    }

    // 表情内容区样式
    .emoji-content {
        flex: 1;
        background-color: #f5f6fa;
        padding: 20rpx;
        overflow-y: auto;

        .emoji-grid {
            display: flex;
            flex-wrap: wrap;
            
            .emoji-item {
                width: 12.5%;
                height: 80rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40rpx;
                transition: transform 0.2s;

                &:active {
                    transform: scale(0.9);
                }

                &.delete {
                    .iconfont {
                        font-size: 40rpx;
                        color: #636e72;
                    }
                }
            }
        }

        .empty-tip {
            width: 100%;
            height: 200rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #b2bec3;
            font-size: 28rpx;
        }
    }

    // 发送按钮样式
    .send-bar {
        height: 100rpx;
        padding: 20rpx;
        border-top: 2rpx solid #f5f6fa;

        .send-button {
            width: 100%;
            height: 100%;
            background-color: #f5f6fa;
            color: #636e72;
            font-size: 28rpx;
            border-radius: 12rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            &.active {
                background-color: #6c5ce7;
                color: #fff;
            }
        }
    }
}
</style> 