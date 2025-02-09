<template>
    <view class="about">
        <view class="logo">
            <image src="/static/images/logo.png" mode="aspectFit" />
            <text class="version">版本 1.0.0</text>
        </view>

        <view class="settings-list">
            <view class="settings-item" @tap="handleCheckUpdate">
                <text class="item-label">检查更新</text>
                <text class="iconfont icon-arrow-right"></text>
            </view>
            <view class="settings-item" @tap="handlePrivacyPolicy">
                <text class="item-label">隐私政策</text>
                <text class="iconfont icon-arrow-right"></text>
            </view>
            <view class="settings-item" @tap="handleUserAgreement">
                <text class="item-label">用户协议</text>
                <text class="iconfont icon-arrow-right"></text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
const handleCheckUpdate = () => {
    uni.showToast({
        title: '已是最新版本',
        icon: 'none'
    });
};

const handlePrivacyPolicy = () => {
    // TODO: 跳转到隐私政策页面
};

const handleUserAgreement = () => {
    // TODO: 跳转到用户协议页面
};
</script>

<style lang="scss">
.about {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20rpx;

    .logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60rpx 0;

        image {
            width: 160rpx;
            height: 160rpx;
            margin-bottom: 20rpx;
        }

        .version {
            font-size: 28rpx;
            color: #999;
        }
    }

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

            .iconfont {
                font-size: 28rpx;
                color: #999;
            }
        }
    }
}
</style> 