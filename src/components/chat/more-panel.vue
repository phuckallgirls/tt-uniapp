<template>
    <view class="more-panel">
        <!-- 功能网格 -->
        <view class="action-grid">
            <!-- 图片 -->
            <view 
                class="action-item"
                @tap="handleAction('image')"
            >
                <view class="icon-wrapper">
                    <text class="iconfont icon-image"></text>
                </view>
                <text class="name">图片</text>
            </view>

            <!-- 拍摄 -->
            <view 
                class="action-item"
                @tap="handleAction('camera')"
            >
                <view class="icon-wrapper">
                    <text class="iconfont icon-camera"></text>
                </view>
                <text class="name">拍摄</text>
            </view>

            <!-- 文件 -->
            <view 
                class="action-item"
                @tap="handleAction('file')"
            >
                <view class="icon-wrapper">
                    <text class="iconfont icon-file"></text>
                </view>
                <text class="name">文件</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
// 定义支持的动作类型
type ActionType = 
    | 'image'   // 从相册选择图片
    | 'camera'  // 拍摄照片
    | 'file';   // 选择文件

// 事件定义
const emit = defineEmits<{
    (e: 'action', type: ActionType): void;  // 当用户选择某个功能时触发
}>();

// 动作处理函数
const handleAction = async (type: ActionType) => {
    try {
        switch (type) {
            case 'image':
                // 触发图片选择事件
                emit('action', 'image');
                break;
            case 'camera':
                // 触发相机拍摄事件
                emit('action', 'camera');
                break;
            case 'file':
                // 触发文件选择事件
                emit('action', 'file');
                break;
        }
    } catch (error) {
        console.error('Action handler error:', error);
        uni.showToast({
            title: '操作失败，请重试',
            icon: 'none'
        });
    }
};
</script>

<style lang="scss">
.more-panel {
    height: 240rpx; // 减少高度，因为功能更少了
    background-color: #fff;
    padding: 20rpx;

    .action-grid {
        display: flex;
        flex-wrap: wrap;

        .action-item {
            width: 25%;
            height: 180rpx;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .icon-wrapper {
                width: 100rpx;
                height: 100rpx;
                background-color: #f5f6fa;
                border-radius: 20rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12rpx;
                transition: all 0.2s;

                &:active {
                    transform: scale(0.9);
                    background-color: #e9ecef;
                }

                .iconfont {
                    font-size: 48rpx;
                    color: #6c5ce7;
                }
            }

            .name {
                font-size: 24rpx;
                color: #2d3436;
            }
        }
    }
}
</style> 