<template>
    <view class="new-friends">
        <!-- 搜索添加 -->
        <view class="search-section">
            <view class="search-box">
                <text class="iconfont icon-search"></text>
                <input
                    v-model="searchText"
                    class="search-input"
                    type="text"
                    placeholder="输入用户名/ID搜索"
                    @confirm="handleSearch"
                />
            </view>
            <button class="search-btn" @tap="handleSearch">搜索</button>
        </view>

        <!-- 搜索结果 -->
        <view v-if="searchResult" class="search-result">
            <view class="user-card">
                <image class="avatar" :src="searchResult.avatar || defaultAvatar" mode="aspectFill" />
                <view class="info">
                    <view class="name-row">
                        <text class="nickname">{{ searchResult.nickname }}</text>
                        <text class="username">ID: {{ searchResult.userid }}</text>
                    </view>
                    <text class="signature">{{ searchResult.signature || '这个人很懒，什么都没写~' }}</text>
                </view>
                <button 
                    class="add-btn"
                    :class="{ 'btn-disabled': searchResult.isFriend }"
                    @tap="handleAddFriend(searchResult)"
                >
                    {{ searchResult.isFriend ? '已是好友' : '添加' }}
                </button>
            </view>
        </view>

        <!-- 好友申请列表 -->
        <view class="request-list">
            <view class="list-header">
                <text class="title">好友申请</text>
                <text class="count" v-if="pendingRequests.length > 0">
                    {{ pendingRequests.length }}个待处理
                </text>
            </view>

            <view v-if="friendRequests.length === 0" class="empty-tip">
                <image class="empty-icon" src="/static/images/empty-requests.png" mode="aspectFit" />
                <text class="empty-text">暂无好友申请</text>
            </view>

            <view 
                v-for="request in friendRequests"
                :key="request.id"
                class="request-item"
            >
                <image class="avatar" :src="request.fromAvatar || defaultAvatar" mode="aspectFill" />
                <view class="content">
                    <view class="top-row">
                        <text class="nickname">{{ request.fromNickname }}</text>
                        <text class="time">{{ formatTime(request.createTime) }}</text>
                    </view>
                    <text class="message">{{ request.message || '请求添加你为好友' }}</text>
                    
                    <!-- 待处理状态 -->
                    <view v-if="request.status === FriendRequestStatus.PENDING" class="action-row">
                        <button 
                            class="action-btn reject"
                            @tap="handleRequest(request, FriendRequestStatus.REJECTED)"
                        >
                            拒绝
                        </button>
                        <button 
                            class="action-btn accept"
                            @tap="handleRequest(request, FriendRequestStatus.ACCEPTED)"
                        >
                            接受
                        </button>
                    </view>
                    
                    <!-- 其他状态 -->
                    <text v-else class="status-text" :class="getStatusClass(request.status)">
                        {{ getStatusText(request.status) }}
                    </text>
                </view>
            </view>
        </view>

        <!-- 添加好友弹窗 -->
        <uni-popup ref="addPopup" type="center">
            <view class="add-popup">
                <view class="popup-header">
                    <text class="title">添加好友</text>
                    <text class="close" @tap="closeAddPopup">×</text>
                </view>
                <view class="popup-content">
                    <textarea
                        v-model="addMessage"
                        class="message-input"
                        placeholder="请输入验证消息"
                        maxlength="50"
                    />
                    <text class="word-count">{{ addMessage.length }}/50</text>
                </view>
                <view class="popup-footer">
                    <button class="cancel-btn" @tap="closeAddPopup">取消</button>
                    <button class="confirm-btn" @tap="sendFriendRequest">发送</button>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FriendRequestStatus, type FriendRequest } from '@/types/friend';
import type { UserProfile } from '@/types/profile';
import dayjs from 'dayjs';

const defaultAvatar = '/static/images/avatar/default.png';
const searchText = ref('');
const searchResult = ref<UserProfile & { isFriend: boolean }>();
const friendRequests = ref<FriendRequest[]>([]);
const addMessage = ref('');
const selectedUser = ref<UserProfile>();
const addPopup = ref();

// 待处理的请求
const pendingRequests = computed(() => {
    return friendRequests.value.filter(
        request => request.status === FriendRequestStatus.PENDING
    );
});

/**
 * 处理搜索
 */
const handleSearch = async () => {
    if (!searchText.value.trim()) {
        uni.showToast({
            title: '请输入搜索内容',
            icon: 'none'
        });
        return;
    }

    try {
        uni.showLoading({ title: '搜索中...' });
        // TODO: 通过 WebSocket 发送搜索请求到 Flamingo 服务器
        // const response = await searchUser(searchText.value);
        
        // 模拟搜索结果
        searchResult.value = {
            userid: 1001,
            username: 'test_user',
            nickname: '测试用户',
            avatar: defaultAvatar,
            signature: '这是一个测试账号',
            isFriend: false
        };
    } catch (error) {
        console.error('搜索失败:', error);
        uni.showToast({
            title: '搜索失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 处理添加好友
 */
const handleAddFriend = (user: UserProfile) => {
    if (user.isFriend) return;
    selectedUser.value = user;
    addMessage.value = '';
    addPopup.value.open();
};

/**
 * 发送好友请求
 */
const sendFriendRequest = async () => {
    if (!selectedUser.value) return;
    
    try {
        uni.showLoading({ title: '发送中...' });
        // TODO: 通过 WebSocket 发送好友请求到 Flamingo 服务器
        // const response = await sendRequest({
        //     toUserId: selectedUser.value.userid,
        //     message: addMessage.value
        // });
        
        uni.showToast({
            title: '请求已发送',
            icon: 'success'
        });
        closeAddPopup();
    } catch (error) {
        console.error('发送请求失败:', error);
        uni.showToast({
            title: '发送失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 关闭添加好友弹窗
 */
const closeAddPopup = () => {
    addPopup.value.close();
    selectedUser.value = undefined;
    addMessage.value = '';
};

/**
 * 处理好友请求
 */
const handleRequest = async (request: FriendRequest, status: FriendRequestStatus) => {
    try {
        uni.showLoading({ title: '处理中...' });
        // TODO: 通过 WebSocket 发送处理结果到 Flamingo 服务器
        // const response = await handleFriendRequest({
        //     requestId: request.id,
        //     status
        // });
        
        // 更新本地状态
        const index = friendRequests.value.findIndex(r => r.id === request.id);
        if (index !== -1) {
            friendRequests.value[index] = {
                ...request,
                status,
                handleTime: Date.now()
            };
        }

        uni.showToast({
            title: status === FriendRequestStatus.ACCEPTED ? '已添加' : '已拒绝',
            icon: 'success'
        });
    } catch (error) {
        console.error('处理请求失败:', error);
        uni.showToast({
            title: '处理失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 获取状态文本
 */
const getStatusText = (status: FriendRequestStatus): string => {
    const statusMap = {
        [FriendRequestStatus.ACCEPTED]: '已添加',
        [FriendRequestStatus.REJECTED]: '已拒绝',
        [FriendRequestStatus.IGNORED]: '已忽略'
    };
    return statusMap[status] || '';
};

/**
 * 获取状态样式类
 */
const getStatusClass = (status: FriendRequestStatus): string => {
    const classMap = {
        [FriendRequestStatus.ACCEPTED]: 'status-accepted',
        [FriendRequestStatus.REJECTED]: 'status-rejected',
        [FriendRequestStatus.IGNORED]: 'status-ignored'
    };
    return classMap[status] || '';
};

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
 * 加载好友请求列表
 */
const loadFriendRequests = async () => {
    try {
        // TODO: 通过 WebSocket 获取好友请求列表
        // const response = await getFriendRequests();
        // friendRequests.value = response.data;
        
        // 模拟数据
        friendRequests.value = [
            {
                id: '1',
                fromUserId: 1002,
                fromUsername: 'test_user2',
                fromNickname: '测试用户2',
                fromAvatar: defaultAvatar,
                toUserId: 1001,
                message: '我是测试用户2，请添加我为好友',
                status: FriendRequestStatus.PENDING,
                createTime: Date.now() - 3600000
            }
        ];
    } catch (error) {
        console.error('加载好友请求失败:', error);
        uni.showToast({
            title: '加载失败',
            icon: 'none'
        });
    }
};

onLoad(() => {
    loadFriendRequests();
});

onPullDownRefresh(() => {
    loadFriendRequests().finally(() => {
        uni.stopPullDownRefresh();
    });
});
</script>

<style lang="scss">
.new-friends {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 20rpx;

    .search-section {
        display: flex;
        align-items: center;
        margin-bottom: 30rpx;

        .search-box {
            flex: 1;
            height: 80rpx;
            background-color: #fff;
            border-radius: 40rpx;
            display: flex;
            align-items: center;
            padding: 0 30rpx;
            margin-right: 20rpx;

            .icon-search {
                font-size: 36rpx;
                color: #8a8a8a;
                margin-right: 20rpx;
            }

            .search-input {
                flex: 1;
                height: 100%;
                font-size: 28rpx;
            }
        }

        .search-btn {
            width: 120rpx;
            height: 80rpx;
            background: linear-gradient(45deg, #6c5ce7, #a363d9);
            border-radius: 40rpx;
            color: #fff;
            font-size: 28rpx;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .search-result {
        margin-bottom: 30rpx;

        .user-card {
            background-color: #fff;
            border-radius: 20rpx;
            padding: 30rpx;
            display: flex;
            align-items: center;

            .avatar {
                width: 100rpx;
                height: 100rpx;
                border-radius: 50rpx;
                margin-right: 20rpx;
            }

            .info {
                flex: 1;

                .name-row {
                    margin-bottom: 8rpx;

                    .nickname {
                        font-size: 32rpx;
                        color: #2d3436;
                        margin-right: 16rpx;
                    }

                    .username {
                        font-size: 24rpx;
                        color: #8a8a8a;
                    }
                }

                .signature {
                    font-size: 26rpx;
                    color: #636e72;
                }
            }

            .add-btn {
                width: 120rpx;
                height: 60rpx;
                background: linear-gradient(45deg, #6c5ce7, #a363d9);
                border-radius: 30rpx;
                color: #fff;
                font-size: 28rpx;
                display: flex;
                align-items: center;
                justify-content: center;

                &.btn-disabled {
                    background: #b2bec3;
                }
            }
        }
    }

    .request-list {
        .list-header {
            display: flex;
            align-items: center;
            margin-bottom: 20rpx;
            padding: 0 10rpx;

            .title {
                font-size: 32rpx;
                color: #2d3436;
                font-weight: bold;
            }

            .count {
                margin-left: 20rpx;
                font-size: 24rpx;
                color: #6c5ce7;
            }
        }

        .empty-tip {
            padding: 100rpx 0;
            display: flex;
            flex-direction: column;
            align-items: center;

            .empty-icon {
                width: 200rpx;
                height: 200rpx;
                margin-bottom: 30rpx;
            }

            .empty-text {
                font-size: 28rpx;
                color: #8a8a8a;
            }
        }

        .request-item {
            background-color: #fff;
            border-radius: 20rpx;
            padding: 30rpx;
            margin-bottom: 20rpx;
            display: flex;

            .avatar {
                width: 100rpx;
                height: 100rpx;
                border-radius: 50rpx;
                margin-right: 20rpx;
            }

            .content {
                flex: 1;

                .top-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10rpx;

                    .nickname {
                        font-size: 32rpx;
                        color: #2d3436;
                    }

                    .time {
                        font-size: 24rpx;
                        color: #8a8a8a;
                    }
                }

                .message {
                    font-size: 28rpx;
                    color: #636e72;
                    margin-bottom: 20rpx;
                }

                .action-row {
                    display: flex;
                    justify-content: flex-end;

                    .action-btn {
                        width: 120rpx;
                        height: 60rpx;
                        border-radius: 30rpx;
                        font-size: 28rpx;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: 20rpx;

                        &.reject {
                            background-color: #f5f6fa;
                            color: #636e72;
                        }

                        &.accept {
                            background: linear-gradient(45deg, #6c5ce7, #a363d9);
                            color: #fff;
                        }
                    }
                }

                .status-text {
                    font-size: 26rpx;
                    float: right;

                    &.status-accepted {
                        color: #4cd964;
                    }

                    &.status-rejected {
                        color: #ff3b30;
                    }

                    &.status-ignored {
                        color: #8a8a8a;
                    }
                }
            }
        }
    }

    .add-popup {
        width: 600rpx;
        background-color: #fff;
        border-radius: 20rpx;
        overflow: hidden;

        .popup-header {
            padding: 30rpx;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2rpx solid #f5f6fa;

            .title {
                font-size: 32rpx;
                color: #2d3436;
                font-weight: bold;
            }

            .close {
                font-size: 40rpx;
                color: #8a8a8a;
                padding: 0 20rpx;
            }
        }

        .popup-content {
            padding: 30rpx;
            position: relative;

            .message-input {
                width: 100%;
                height: 200rpx;
                background-color: #f5f6fa;
                border-radius: 12rpx;
                padding: 20rpx;
                font-size: 28rpx;
            }

            .word-count {
                position: absolute;
                right: 40rpx;
                bottom: 40rpx;
                font-size: 24rpx;
                color: #8a8a8a;
            }
        }

        .popup-footer {
            display: flex;
            border-top: 2rpx solid #f5f6fa;

            button {
                flex: 1;
                height: 90rpx;
                font-size: 32rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0;

                &.cancel-btn {
                    background-color: #fff;
                    color: #636e72;
                }

                &.confirm-btn {
                    background: linear-gradient(45deg, #6c5ce7, #a363d9);
                    color: #fff;
                }
            }
        }
    }
}
</style> 