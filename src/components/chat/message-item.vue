<template>
    <view 
        class="message-item"
        :class="[
            message.senderId === currentUserId ? 'self' : 'other',
            `type-${message.type}`
        ]"
    >
        <!-- 头像 -->
        <image 
            v-if="message.senderId !== currentUserId"
            class="avatar"
            :src="senderAvatar"
            mode="aspectFill"
            @tap="handleAvatarTap"
        />

        <!-- 消息内容容器 -->
        <view class="content-wrapper">
            <!-- 发送者名称 -->
            <text 
                v-if="message.senderId !== currentUserId && showName"
                class="sender-name"
            >
                {{ senderName }}
            </text>

            <!-- 消息内容 -->
            <view class="content" :class="{ 'has-status': message.status }">
                <!-- 文本消息 -->
                <text 
                    v-if="message.type === 'text'"
                    class="text-content"
                    :selectable="true"
                >{{ message.content }}</text>

                <!-- 图片消息 -->
                <image 
                    v-else-if="message.type === 'image'"
                    class="image-content"
                    :src="localImageUrl"
                    mode="widthFix"
                    @tap="handleImageTap"
                    @load="handleImageLoad"
                />

                <!-- 文件消息 -->
                <view 
                    v-else-if="message.type === 'file'"
                    class="file-content"
                    @tap="handleFileTap"
                >
                    <text class="iconfont icon-file"></text>
                    <view class="file-info">
                        <text class="file-name">{{ getFileName(message.content) }}</text>
                        <text class="file-size" v-if="fileSize">{{ fileSize }}</text>
                    </view>
                    <text class="iconfont icon-download"></text>
                </view>

                <!-- 消息状态 -->
                <view v-if="message.status" class="message-status">
                    <!-- 发送中 -->
                    <view v-if="message.status === 'sending'" class="status-sending">
                        <text class="iconfont icon-loading loading"></text>
                    </view>
                    <!-- 发送失败 -->
                    <view 
                        v-else-if="message.status === 'failed'"
                        class="status-failed"
                        @tap="handleResend"
                    >
                        <text class="iconfont icon-warning"></text>
                    </view>
                </view>
            </view>

            <!-- 消息时间 -->
            <text class="time">{{ formatTime(message.timestamp) }}</text>
        </view>

        <!-- 自己的头像 -->
        <image 
            v-if="message.senderId === currentUserId"
            class="avatar"
            :src="senderAvatar"
            mode="aspectFill"
            @tap="handleAvatarTap"
        />
    </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Message } from '@/types/chat';
import { useUserStore } from '@/stores/user';
import { formatTime } from '@/utils/time';
import { messageCacheManager } from '../../utils/cache';

// 组件属性定义
const props = defineProps<{
    message: Message;          // 消息对象
    showName?: boolean;        // 是否显示发送者名称
    senderName?: string;       // 发送者名称
    senderAvatar?: string;     // 发送者头像
}>();

// 事件定义
const emit = defineEmits<{
    (e: 'resend', message: Message): void;           // 重新发送消息
    (e: 'avatar-tap', userId: string): void;         // 点击头像
    (e: 'image-tap', url: string): void;            // 点击图片
    (e: 'file-tap', url: string): void;             // 点击文件
}>();

const userStore = useUserStore();
const currentUserId = computed(() => userStore.userId);

// 文件大小
const fileSize = ref<string>('');

// 获取文件名
const getFileName = (url: string): string => {
    try {
        return decodeURIComponent(url.split('/').pop() || '未知文件');
    } catch {
        return '未知文件';
    }
};

// 图片加载完成处理
const handleImageLoad = (e: any) => {
    // 可以在这里处理图片加载完成后的逻辑
    // 比如更新消息高度等
};

// 点击头像
const handleAvatarTap = () => {
    emit('avatar-tap', props.message.senderId);
};

// 点击图片
const handleImageTap = () => {
    emit('image-tap', props.message.content);
};

// 点击文件
const handleFileTap = () => {
    emit('file-tap', props.message.content);
};

// 重新发送消息
const handleResend = () => {
    emit('resend', props.message);
};

// 本地图片URL
const localImageUrl = ref('');

// 加载图片
const loadImage = async (url: string) => {
    if (!url) return;
    localImageUrl.value = await messageCacheManager.cacheImage(url);
};

// 生命周期钩子
onMounted(() => {
    // 如果是图片消息，进行缓存处理
    if (props.message.type === 'image' && props.message.content) {
        loadImage(props.message.content);
    }
});
</script>

<style lang="scss">
.message-item {
    padding: 20rpx;
    display: flex;
    align-items: flex-start;

    // 头像样式
    .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 12rpx;
        background-color: #f5f6fa;
    }

    // 内容容器样式
    .content-wrapper {
        max-width: 60%;
        margin: 0 20rpx;
        display: flex;
        flex-direction: column;

        // 发送者名称
        .sender-name {
            font-size: 24rpx;
            color: #636e72;
            margin-bottom: 8rpx;
        }

        // 消息内容
        .content {
            position: relative;
            background-color: #fff;
            border-radius: 12rpx;
            padding: 20rpx;
            word-break: break-all;

            &.has-status {
                padding-right: 60rpx;
            }

            // 文本消息
            .text-content {
                font-size: 32rpx;
                line-height: 1.5;
                color: #2d3436;
            }

            // 图片消息
            .image-content {
                max-width: 400rpx;
                border-radius: 12rpx;
            }

            // 文件消息
            .file-content {
                display: flex;
                align-items: center;
                padding: 20rpx;
                background-color: #f5f6fa;
                border-radius: 12rpx;

                .iconfont {
                    font-size: 48rpx;
                    color: #6c5ce7;
                    margin-right: 20rpx;

                    &.icon-download {
                        margin-right: 0;
                        margin-left: 20rpx;
                        font-size: 36rpx;
                        color: #b2bec3;
                    }
                }

                .file-info {
                    flex: 1;
                    overflow: hidden;

                    .file-name {
                        font-size: 28rpx;
                        color: #2d3436;
                        @include text-ellipsis;
                    }

                    .file-size {
                        font-size: 24rpx;
                        color: #636e72;
                        margin-top: 4rpx;
                    }
                }
            }

            // 消息状态
            .message-status {
                position: absolute;
                right: 12rpx;
                bottom: 12rpx;
                
                .status-sending {
                    .loading {
                        font-size: 32rpx;
                        color: #b2bec3;
                        animation: rotate 1s linear infinite;
                    }
                }

                .status-failed {
                    .icon-warning {
                        font-size: 32rpx;
                        color: #ff7675;
                    }
                }
            }
        }

        // 消息时间
        .time {
            font-size: 24rpx;
            color: #b2bec3;
            margin-top: 8rpx;
            align-self: center;
        }
    }

    // 自己发送的消息样式
    &.self {
        flex-direction: row-reverse;

        .content {
            background-color: #6c5ce7;

            .text-content {
                color: #fff;
            }
        }
    }
}

// 加载动画
@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style> 