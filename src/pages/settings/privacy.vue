<template>
    <view class="privacy-settings">
        <view class="settings-list">
            <view class="settings-item">
                <text class="item-label">加我为好友时需要验证</text>
                <switch :checked="needVerify" @change="handleVerifyChange" color="#2d8cf0" />
            </view>
            <view class="settings-item">
                <text class="item-label">不允许陌生人查看我的资料</text>
                <switch :checked="privateProfile" @change="handlePrivateChange" color="#2d8cf0" />
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const needVerify = ref(true);
const privateProfile = ref(false);

const handleVerifyChange = (e: any) => {
    needVerify.value = e.detail.value;
};

const handlePrivateChange = (e: any) => {
    privateProfile.value = e.detail.value;
};
</script>

<style lang="scss">
.privacy-settings {
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
        }
    }
}
</style> 