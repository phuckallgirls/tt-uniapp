<template>
    <view class="account-settings">
        <view class="settings-list">
            <view class="settings-item" @tap="handleChangePassword">
                <text class="item-label">修改密码</text>
                <text class="iconfont icon-arrow-right"></text>
            </view>
            <view class="settings-item">
                <text class="item-label">账号安全</text>
                <text class="item-value">已开启</text>
                <text class="iconfont icon-arrow-right"></text>
            </view>
        </view>

        <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>
</template>

<script setup lang="ts">
const handleChangePassword = () => {
    uni.showToast({
        title: '修改密码功能开发中',
        icon: 'none'
    });
};

const handleLogout = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
            if (res.confirm) {
                // TODO: 调用退出登录 API
                uni.reLaunch({
                    url: '/pages/login/index'
                });
            }
        }
    });
};
</script>

<style lang="scss">
.account-settings {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20rpx;

    .settings-list {
        background-color: #fff;
        border-radius: 8rpx;

        .settings-item {
            display: flex;
            align-items: center;
            padding: 30rpx 20rpx;
            border-bottom: 2rpx solid #f5f5f5;

            &:last-child {
                border-bottom: none;
            }

            .item-label {
                flex: 1;
                font-size: 28rpx;
            }

            .item-value {
                font-size: 28rpx;
                color: #999;
                margin-right: 10rpx;
            }

            .iconfont {
                font-size: 28rpx;
                color: #999;
            }
        }
    }

    .logout-btn {
        margin-top: 40rpx;
        width: 100%;
        height: 80rpx;
        line-height: 80rpx;
        text-align: center;
        background-color: #fff;
        color: #ff3b30;
        border-radius: 8rpx;
        font-size: 28rpx;
        border: none;
    }
}
</style> 