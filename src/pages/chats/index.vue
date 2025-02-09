<template>
    <view class="chats-container">
        <!-- 搜索栏 -->
        <view class="search-box">
            <view class="search-bar">
                <text class="iconfont icon-search"></text>
                <input
                    v-model="searchText"
                    class="search-input"
                    type="text"
                    placeholder="搜索"
                    confirm-type="search"
                    @confirm="handleSearch"
                />
            </view>
        </view>

        <!-- 会话列表 -->
        <scroll-view
            class="chat-list"
            scroll-y
            @scrolltolower="loadMore"
            @refresherrefresh="refresh"
            :refresher-enabled="true"
            :refresher-triggered="isRefreshing"
        >
            <view
                v-for="chat in chatList"
                :key="chat.id"
                class="chat-item"
                hover-class="chat-item-hover"
                @tap="navigateToChat(chat)"
            >
                <!-- 头像 -->
                <view class="avatar-box">
                    <image class="avatar" :src="chat.avatar" mode="aspectFill" />
                    <view
                        v-if="chat.type === ChatType.SINGLE && chat.online"
                        class="online-status"
                    />
                </view>

                <!-- 会话信息 -->
                <view class="chat-info">
                    <view class="top-row">
                        <text class="name">{{ chat.name }}</text>
                        <text class="time">{{ formatTime(chat.lastMessageTime) }}</text>
                    </view>
                    <view class="bottom-row">
                        <view class="message">
                            <text v-if="chat.lastMessageType !== MessageType.TEXT" class="message-type">
                                [{{ getMessageTypeText(chat.lastMessageType) }}]
                            </text>
                            {{ chat.lastMessage }}
                        </view>
                        <view
                            v-if="chat.unreadCount > 0"
                            class="unread-count"
                        >
                            {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
                        </view>
                    </view>
                </view>
            </view>

            <!-- 加载更多 -->
            <view v-if="hasMore" class="loading-more">
                正在加载更多...
            </view>
            <view v-else class="no-more">
                没有更多了
            </view>
        </scroll-view>

        <!-- 悬浮按钮 -->
        <view class="float-button" @tap="showNewChatOptions">
            <text class="iconfont icon-add"></text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChatType, MessageType, type ChatSession } from '@/types/chat';
import dayjs from 'dayjs';
import { onLoad, onPullDownRefresh, onReachBottom, onUnload } from '@dcloudio/uni-app';  // 添加这行

// 搜索文本
const searchText = ref('');
// 是否正在刷新
const isRefreshing = ref(false);
// 是否正在加载
const isLoading = ref(false);
// 是否有更多数据
const hasMore = ref(true);

// 模拟会话列表数据
const chatList = ref<ChatSession[]>([
    {
        id: '1',
        type: ChatType.SINGLE,
        name: '张三',
        avatar: '/static/images/avatar/default.png',
        lastMessage: '好的，明天见！',
        lastMessageType: MessageType.TEXT,
        lastMessageTime: Date.now() - 300000,
        unreadCount: 2,
        online: true
    },
    {
        id: '2',
        type: ChatType.GROUP,
        name: '项目讨论组',
        avatar: '/static/images/avatar/group.png',
        lastMessage: '请查看最新的设计稿',
        lastMessageType: MessageType.FILE,
        lastMessageTime: Date.now() - 3600000,
        unreadCount: 5
    }
]);

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
    const messageDate = dayjs(timestamp);
    const now = dayjs();

    if (messageDate.isSame(now, 'day')) {
        return messageDate.format('HH:mm');
    } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
        return '昨天';
    } else if (messageDate.isSame(now, 'year')) {
        return messageDate.format('M月D日');
    }
    return messageDate.format('YYYY/M/D');
};

/**
 * 获取消息类型文本
 */
const getMessageTypeText = (type: MessageType): string => {
    const typeMap = {
        [MessageType.TEXT]: '文本',
        [MessageType.IMAGE]: '图片',
        [MessageType.FILE]: '文件',
        [MessageType.AUDIO]: '语音',
        [MessageType.VIDEO]: '视频'
    };
    return typeMap[type] || '未知类型';
};

/**
 * 处理搜索
 */
const handleSearch = () => {
    if (!searchText.value.trim()) {
        return;
    }
    // TODO: 实现搜索逻辑
    console.log('搜索:', searchText.value);
};

/**
 * 加载更多
 */
const loadMore = async () => {
    if (!hasMore.value || isLoading.value) return;
    
    isLoading.value = true;
    try {
        // TODO: 实现加载更多逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 模拟加载更多数据
        const moreData: ChatSession[] = [
            {
                id: '3',
                type: ChatType.SINGLE,
                name: '李四',
                avatar: '/static/images/avatar/default2.png',
                lastMessage: '收到了吗？',
                lastMessageType: MessageType.TEXT,
                lastMessageTime: Date.now() - 86400000,
                unreadCount: 0,
                online: false
            }
        ];
        chatList.value.push(...moreData);
        hasMore.value = false;
    } finally {
        isLoading.value = false;
    }
};

/**
 * 刷新列表
 */
const refresh = async () => {
    if (isRefreshing.value) return;
    
    isRefreshing.value = true;
    try {
        // TODO: 实现刷新逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 模拟刷新数据
        chatList.value = [...chatList.value];
        // 重置加载状态
        hasMore.value = true;
    } finally {
        isRefreshing.value = false;
        uni.stopPullDownRefresh();
    }
};

/**
 * 导航到聊天页面
 */
const navigateToChat = (chat: ChatSession) => {
    // 根据聊天类型跳转到不同页面
    const chatPage = chat.type === ChatType.SINGLE ? 'single' : 'group';
    uni.navigateTo({
        url: `/pages/chat/${chatPage}?id=${chat.id}&name=${encodeURIComponent(chat.name)}`
    });
};

/**
 * 显示新建聊天选项
 */
const showNewChatOptions = () => {
    uni.showActionSheet({
        itemList: ['发起单聊', '创建群聊'],
        success: (res) => {
            if (res.tapIndex === 0) {
                uni.navigateTo({
                    url: '/pages/contacts/select'
                });
            } else {
                uni.navigateTo({
                    url: '/pages/group/create'
                });
            }
        }
    });
};

/**
 * 生命周期
 */
onLoad(() => {
    // 初始化数据
    refresh();
});

onPullDownRefresh(() => {
    refresh();
});

onReachBottom(() => {
    loadMore();
});

onUnload(() => {
    // 清理工作
});
</script>

<style lang="scss">
.chats-container {
    height: 100vh;
    background-color: #f8f9fa;
    display: flex;
    flex-direction: column;

    .search-box {
        padding: 20rpx 30rpx;
        background-color: #fff;

        .search-bar {
            height: 72rpx;
            background-color: #f5f6fa;
            border-radius: 36rpx;
            display: flex;
            align-items: center;
            padding: 0 30rpx;

            .icon-search {
                font-size: 32rpx;
                color: #8a8a8a;
                margin-right: 20rpx;
            }

            .search-input {
                flex: 1;
                height: 100%;
                font-size: 28rpx;
            }
        }
    }

    .chat-list {
        flex: 1;
        
        .chat-item {
            display: flex;
            padding: 20rpx 30rpx;
            background-color: #fff;
            border-bottom: 2rpx solid #f5f6fa;

            &-hover {
                background-color: #f8f9fa;
            }

            .avatar-box {
                position: relative;
                margin-right: 20rpx;

                .avatar {
                    width: 100rpx;
                    height: 100rpx;
                    border-radius: 20rpx;
                }

                .online-status {
                    position: absolute;
                    right: -4rpx;
                    bottom: -4rpx;
                    width: 20rpx;
                    height: 20rpx;
                    border-radius: 50%;
                    background-color: #4cd964;
                    border: 4rpx solid #fff;
                }
            }

            .chat-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;

                .top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .name {
                        font-size: 32rpx;
                        color: #2d3436;
                        font-weight: 500;
                    }

                    .time {
                        font-size: 24rpx;
                        color: #8a8a8a;
                    }
                }

                .bottom-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .message {
                        flex: 1;
                        font-size: 28rpx;
                        color: #636e72;
                        @include text-ellipsis;

                        .message-type {
                            color: #6c5ce7;
                            margin-right: 8rpx;
                        }
                    }

                    .unread-count {
                        min-width: 36rpx;
                        height: 36rpx;
                        padding: 0 10rpx;
                        background-color: #ff3b30;
                        border-radius: 18rpx;
                        color: #fff;
                        font-size: 24rpx;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }
            }
        }

        .loading-more, .no-more {
            text-align: center;
            padding: 20rpx;
            color: #8a8a8a;
            font-size: 24rpx;
        }
    }

    .float-button {
        position: fixed;
        right: 30rpx;
        bottom: calc(140rpx + env(safe-area-inset-bottom));
        width: 100rpx;
        height: 100rpx;
        background-color: #2d8cf0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
        z-index: 99;

        .icon-add {
            color: #fff;
            font-size: 48rpx;
        }
    }
}
</style> 