<template>
    <view class="container">
        <!-- 底部导航栏 -->
        <view class="tab-bar">
            <view 
                class="tab-item"
                :class="{ active: currentTab === 'chats' }"
                @tap="switchTab('chats')"
            >
                <text class="iconfont icon-message"></text>
                <text class="tab-text">消息</text>
            </view>
            
            <view 
                class="tab-item"
                :class="{ active: currentTab === 'contacts' }"
                @tap="switchTab('contacts')"
            >
                <text class="iconfont icon-contacts"></text>
                <text class="tab-text">联系人</text>
            </view>
            
            <view 
                class="tab-item"
                :class="{ active: currentTab === 'profile' }"
                @tap="switchTab('profile')"
            >
                <text class="iconfont icon-user"></text>
                <text class="tab-text">我的</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const currentTab = ref('chats');

// 切换标签页
const switchTab = (tab: string) => {
    currentTab.value = tab;
    uni.navigateTo({
        url: `/pages/${tab}/index`
    });
};
</script>

<style lang="scss">
.container {
    min-height: 100vh;
    background-color: #f8f9fa;
    position: relative;
}

.tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100rpx;
    background-color: #fff;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

    .tab-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10rpx 0;

        .iconfont {
            font-size: 48rpx;
            color: #b2bec3;
            margin-bottom: 4rpx;
        }

        .tab-text {
            font-size: 24rpx;
            color: #b2bec3;
        }

        &.active {
            .iconfont,
            .tab-text {
                color: #6c5ce7;
            }
        }
    }
}
</style>

