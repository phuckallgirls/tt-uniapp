<template>
    <view class="chat-history">
        <view class="settings-list">
            <view class="settings-item" @tap="handleClearHistory">
                <text class="item-label">清空聊天记录</text>
                <text class="iconfont icon-arrow-right"></text>
            </view>
            <view class="settings-item">
                <text class="item-label">保存聊天记录</text>
                <switch :checked="saveHistory" @change="handleSaveChange" color="#2d8cf0" />
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const saveHistory = ref(true);

const handleSaveChange = (e: any) => {
    saveHistory.value = e.detail.value;
};

const handleClearHistory = () => {
    uni.showModal({
        title: '提示',
        content: '确定要清空所有聊天记录吗？此操作不可恢复',
        success: (res) => {
            if (res.confirm) {
                // TODO: 调用清空聊天记录 API
                uni.showToast({
                    title: '清空成功',
                    icon: 'success'
                });
            }
        }
    });
};
</script>

<style lang="scss">
.chat-history {
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

            .iconfont {
                font-size: 28rpx;
                color: #999;
            }
        }
    }
}
</style> 