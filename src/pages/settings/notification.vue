<template>
    <view class="notification-settings">
        <view class="settings-list">
            <view class="settings-item">
                <text class="item-label">接收新消息通知</text>
                <switch :checked="receiveNotification" @change="handleNotificationChange" color="#2d8cf0" />
            </view>
            <view class="settings-item">
                <text class="item-label">通知显示消息详情</text>
                <switch :checked="showMessageDetail" @change="handleDetailChange" color="#2d8cf0" />
            </view>
            <view class="settings-item">
                <text class="item-label">声音</text>
                <switch :checked="enableSound" @change="handleSoundChange" color="#2d8cf0" />
            </view>
            <view class="settings-item">
                <text class="item-label">振动</text>
                <switch :checked="enableVibrate" @change="handleVibrateChange" color="#2d8cf0" />
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const receiveNotification = ref(true);
const showMessageDetail = ref(true);
const enableSound = ref(true);
const enableVibrate = ref(true);

const handleNotificationChange = (e: any) => {
    receiveNotification.value = e.detail.value;
};

const handleDetailChange = (e: any) => {
    showMessageDetail.value = e.detail.value;
};

const handleSoundChange = (e: any) => {
    enableSound.value = e.detail.value;
};

const handleVibrateChange = (e: any) => {
    enableVibrate.value = e.detail.value;
};
</script>

<style lang="scss">
.notification-settings {
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