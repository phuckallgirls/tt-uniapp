<template>
    <view class="contact-detail">
        <!-- 基本信息 -->
        <view class="user-info">
            <image class="avatar" :src="userInfo?.avatar || '/static/images/avatar/default.png'" mode="aspectFill" />
            <view class="info-content">
                <text class="nickname">{{ userInfo?.nickname }}</text>
                <text class="account">账号：{{ userInfo?.username }}</text>
            </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-list">
            <button class="action-btn" @tap="handleStartChat">发送消息</button>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { UserInfo } from '@/types/user';

// 用户信息
const userInfo = ref<UserInfo | null>(null);

// 开始聊天
const handleStartChat = () => {
    if (!userInfo.value) return;
    
    uni.navigateTo({
        url: `/pages/chat/single?id=${userInfo.value.userid}&name=${encodeURIComponent(userInfo.value.nickname)}`
    });
};

// 加载用户信息
const loadUserInfo = async (userid: number) => {
    try {
        // TODO: 调用 Flamingo 的获取用户信息 API
        userInfo.value = {
            userid,
            username: 'user' + userid,
            nickname: '用户' + userid,
            avatar: '/static/images/avatar/default.png'
        };
    } catch (error) {
        console.error('获取用户信息失败:', error);
        uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
        });
    }
};

// 生命周期
onLoad((options) => {
    const userid = parseInt(options.userid as string);
    if (userid) {
        loadUserInfo(userid);
    }
});
</script>

<style lang="scss">
.contact-detail {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20rpx;

    .user-info {
        display: flex;
        align-items: center;
        padding: 20rpx;
        background-color: #fff;
        border-radius: 8rpx;
        margin-bottom: 20rpx;

        .avatar {
            width: 100rpx;
            height: 100rpx;
            border-radius: 50rpx;
            margin-right: 20rpx;
        }

        .info-content {
            flex: 1;

            .nickname {
                font-size: 32rpx;
                font-weight: bold;
                margin-bottom: 8rpx;
            }

            .account {
                font-size: 24rpx;
                color: #999;
            }
        }
    }

    .action-list {
        padding: 20rpx;

        .action-btn {
            width: 100%;
            height: 80rpx;
            line-height: 80rpx;
            text-align: center;
            background-color: #2d8cf0;
            color: #fff;
            border-radius: 8rpx;
            font-size: 28rpx;
            border: none;
        }
    }
}
</style> 