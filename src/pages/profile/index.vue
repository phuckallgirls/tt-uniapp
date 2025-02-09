<template>
    <view class="profile-container">
        <!-- 用户信息卡片 -->
        <view class="user-card">
            <view class="user-info" @tap="handleEditProfile">
                <image class="avatar" :src="userProfile.avatar || defaultAvatar" mode="aspectFill" />
                <view class="info-right">
                    <view class="name-row">
                        <text class="nickname">{{ userProfile.nickname }}</text>
                        <text class="username">ID: {{ userProfile.userid }}</text>
                    </view>
                    <view class="status-row">
                        <view class="status-tag" :class="[`status-${userProfile.status}`]">
                            {{ getUserStatusText(userProfile.status) }}
                        </view>
                        <text class="signature">{{ userProfile.signature || '这个人很懒，什么都没写~' }}</text>
                    </view>
                </view>
                <text class="iconfont icon-right"></text>
            </view>
        </view>

        <!-- 功能列表 -->
        <view class="function-list">
            <view class="function-group">
                <view class="function-item" @tap="handleAccount">
                    <text class="iconfont icon-account"></text>
                    <text class="title">账号与安全</text>
                    <text class="iconfont icon-right"></text>
                </view>
                <view class="function-item" @tap="handlePrivacy">
                    <text class="iconfont icon-privacy"></text>
                    <text class="title">隐私设置</text>
                    <text class="iconfont icon-right"></text>
                </view>
            </view>

            <view class="function-group">
                <view class="function-item" @tap="handleNotification">
                    <text class="iconfont icon-notification"></text>
                    <text class="title">消息通知</text>
                    <text class="iconfont icon-right"></text>
                </view>
                <view class="function-item" @tap="handleChatHistory">
                    <text class="iconfont icon-history"></text>
                    <text class="title">聊天记录</text>
                    <text class="iconfont icon-right"></text>
                </view>
            </view>

            <view class="function-group">
                <view class="function-item" @tap="handleAbout">
                    <text class="iconfont icon-about"></text>
                    <text class="title">关于</text>
                    <text class="iconfont icon-right"></text>
                </view>
            </view>
        </view>

        <!-- 退出登录按钮 -->
        <view class="logout-btn" @tap="handleLogout">
            退出登录
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import type { UserProfile } from '@/types/profile';
import { UserStatus } from '@/types/profile';
import { onLoad, onUnload } from '@dcloudio/uni-app';

const userStore = useUserStore();
const defaultAvatar = '/static/images/avatar/default.png';

// 用户详细信息
const userProfile = ref<UserProfile>({
    userid: 0,
    username: '',
    nickname: '',
    avatar: '',
    status: UserStatus.OFFLINE,
    gender: 0,
    registerTime: 0,
    lastLoginTime: 0
});

/**
 * 获取用户状态文本
 */
const getUserStatusText = (status: UserStatus): string => {
    const statusMap = {
        [UserStatus.ONLINE]: '在线',
        [UserStatus.OFFLINE]: '离线',
        [UserStatus.BUSY]: '忙碌',
        [UserStatus.AWAY]: '离开'
    };
    return statusMap[status] || '未知';
};

/**
 * 编辑个人资料
 */
const handleEditProfile = () => {
    uni.navigateTo({
        url: '/pages/profile/edit'
    });
};

/**
 * 账号与安全
 */
const handleAccount = () => {
    uni.navigateTo({
        url: '/pages/settings/account'
    });
};

/**
 * 隐私设置
 */
const handlePrivacy = () => {
    uni.navigateTo({
        url: '/pages/settings/privacy'
    });
};

/**
 * 消息通知设置
 */
const handleNotification = () => {
    uni.navigateTo({
        url: '/pages/settings/notification'
    });
};

/**
 * 聊天记录
 */
const handleChatHistory = () => {
    uni.navigateTo({
        url: '/pages/settings/chat-history'
    });
};

/**
 * 关于
 */
const handleAbout = () => {
    uni.navigateTo({
        url: '/pages/settings/about'
    });
};

/**
 * 退出登录
 */
const handleLogout = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
            if (res.confirm) {
                // 发送退出登录消息到服务器
                // TODO: 通过 WebSocket 发送退出消息
                
                // 清除本地数据
                userStore.clearUserInfo();
                
                // 返回登录页
                uni.reLaunch({
                    url: '/pages/login/index'
                });
            }
        }
    });
};

/**
 * 加载用户信息
 */
const loadUserProfile = async () => {
    try {
        // TODO: 通过 WebSocket 获取用户详细信息
        // 这里应该发送获取用户信息的消息到 Flamingo 服务器
        
        // 临时使用 store 中的基本信息
        const basicInfo = userStore.userInfo;
        if (basicInfo) {
            userProfile.value = {
                ...basicInfo,
                status: UserStatus.ONLINE,
                registerTime: Date.now() - 86400000 * 30, // 模拟30天前注册
                lastLoginTime: Date.now() - 3600000 // 模拟1小时前登录
            };
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        uni.showToast({
            title: '加载用户信息失败',
            icon: 'none'
        });
    }
};

onMounted(() => {
    loadUserProfile();
});
</script>

<style lang="scss">
.profile-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 20rpx;

    .user-card {
        background-color: #fff;
        border-radius: 20rpx;
        padding: 30rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

        .user-info {
            display: flex;
            align-items: center;

            .avatar {
                width: 120rpx;
                height: 120rpx;
                border-radius: 60rpx;
                margin-right: 20rpx;
            }

            .info-right {
                flex: 1;

                .name-row {
                    margin-bottom: 10rpx;

                    .nickname {
                        font-size: 36rpx;
                        font-weight: bold;
                        color: #2d3436;
                        margin-right: 20rpx;
                    }

                    .username {
                        font-size: 24rpx;
                        color: #8a8a8a;
                    }
                }

                .status-row {
                    display: flex;
                    align-items: center;

                    .status-tag {
                        padding: 4rpx 12rpx;
                        border-radius: 8rpx;
                        font-size: 24rpx;
                        margin-right: 16rpx;

                        &.status-1 {
                            background-color: #4cd964;
                            color: #fff;
                        }

                        &.status-2 {
                            background-color: #8a8a8a;
                            color: #fff;
                        }

                        &.status-3 {
                            background-color: #ff3b30;
                            color: #fff;
                        }

                        &.status-4 {
                            background-color: #ff9500;
                            color: #fff;
                        }
                    }

                    .signature {
                        font-size: 26rpx;
                        color: #636e72;
                        @include text-ellipsis;
                    }
                }
            }

            .icon-right {
                font-size: 36rpx;
                color: #8a8a8a;
            }
        }
    }

    .function-list {
        .function-group {
            background-color: #fff;
            border-radius: 20rpx;
            margin-bottom: 20rpx;
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

            .function-item {
                display: flex;
                align-items: center;
                padding: 30rpx;
                border-bottom: 2rpx solid #f5f6fa;

                &:last-child {
                    border-bottom: none;
                }

                .iconfont {
                    font-size: 40rpx;
                    margin-right: 20rpx;
                    color: #6c5ce7;

                    &.icon-right {
                        margin-right: 0;
                        color: #8a8a8a;
                    }
                }

                .title {
                    flex: 1;
                    font-size: 32rpx;
                    color: #2d3436;
                }
            }
        }
    }

    .logout-btn {
        margin-top: 60rpx;
        height: 90rpx;
        background: #ff3b30;
        border-radius: 45rpx;
        color: #fff;
        font-size: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style> 