<template>
    <view class="chat-container">
        <!-- 自定义导航栏 -->
        <view class="custom-nav">
            <view class="left" @tap="handleBack">
                <text class="iconfont icon-back"></text>
            </view>
            <view class="center">
                <text class="title">{{ chatInfo.name }}</text>
                <text v-if="chatInfo.typing" class="subtitle">正在输入...</text>
                <text v-else-if="chatInfo.online" class="subtitle">在线</text>
            </view>
            <view class="right" @tap="showChatInfo">
                <text class="iconfont icon-more"></text>
            </view>
        </view>

        <!-- 消息列表 -->
        <scroll-view
            class="message-list"
            scroll-y
            :scroll-into-view="latestMessageId"
            :scroll-with-animation="true"
            @scrolltoupper="loadMoreMessages"
            :refresher-enabled="true"
            :refresher-triggered="isRefreshing"
            @refresherrefresh="handleRefresh"
        >
            <!-- 加载更多提示 -->
            <view v-if="isLoading" class="loading-more">
                <text>加载更多消息...</text>
            </view>

            <!-- 消息列表 -->
            <block v-for="(message, index) in messages" :key="message.id">
                <!-- 日期分割线 -->
                <view v-if="showDateDivider(index)" class="date-divider">
                    {{ formatDate(message.timestamp) }}
                </view>

                <!-- 消息气泡 -->
                <view
                    :id="message.id"
                    class="message-item"
                    :class="{ 'message-self': message.isSelf }"
                >
                    <!-- 头像 -->
                    <image
                        class="avatar"
                        :src="message.senderAvatar"
                        mode="aspectFill"
                        @tap="viewUserInfo(message.senderId)"
                    />

                    <!-- 消息内容 -->
                    <view class="message-content">
                        <!-- 发送者名称（群聊时显示） -->
                        <text
                            v-if="chatInfo.type === ChatType.GROUP && !message.isSelf"
                            class="sender-name"
                        >
                            {{ message.senderName }}
                        </text>

                        <!-- 消息气泡 -->
                        <view
                            class="bubble"
                            :class="[`bubble-${message.type.toLowerCase()}`]"
                            @tap="handleMessageTap(message)"
                            @longpress="handleMessageLongPress(message)"
                        >
                            <!-- 文本消息 -->
                            <text v-if="message.type === MessageType.TEXT" class="text-content">
                                {{ message.content }}
                            </text>

                            <!-- 图片消息 -->
                            <image
                                v-else-if="message.type === MessageType.IMAGE"
                                class="image-content"
                                :src="message.content"
                                mode="widthFix"
                                @tap="previewImage(message)"
                            />

                            <!-- 语音消息 -->
                            <view
                                v-else-if="message.type === MessageType.AUDIO"
                                class="audio-content"
                            >
                                <text class="iconfont icon-voice"></text>
                                <text class="duration">{{ formatDuration(message.duration) }}</text>
                            </view>

                            <!-- 文件消息 -->
                            <view
                                v-else-if="message.type === MessageType.FILE"
                                class="file-content"
                            >
                                <text class="iconfont icon-file"></text>
                                <view class="file-info">
                                    <text class="file-name">{{ message.fileName }}</text>
                                    <text class="file-size">{{ formatFileSize(message.fileSize) }}</text>
                                </view>
                            </view>
                        </view>

                        <!-- 发送状态 -->
                        <view v-if="message.isSelf" class="message-status">
                            <text v-if="message.status === MessageStatus.SENDING" class="status-sending">发送中...</text>
                            <text v-else-if="message.status === MessageStatus.FAILED" class="status-failed" @tap="resendMessage(message)">发送失败，点击重试</text>
                        </view>
                    </view>
                </view>
            </block>
        </scroll-view>

        <!-- 输入区域 -->
        <view class="input-area" :style="{ bottom: keyboardHeight + 'px' }">
            <!-- 功能按钮 -->
            <view class="function-btn" @tap="toggleVoiceInput">
                <text class="iconfont" :class="isVoiceInput ? 'icon-keyboard' : 'icon-voice'"></text>
            </view>

            <!-- 文本输入框/语音按钮 -->
            <view v-if="!isVoiceInput" class="text-input-box">
                <textarea
                    v-model="inputText"
                    class="text-input"
                    :adjust-position="false"
                    :cursor-spacing="20"
                    :show-confirm-bar="false"
                    :hold-keyboard="true"
                    @focus="handleInputFocus"
                    @blur="handleInputBlur"
                    @input="handleInput"
                />
            </view>
            <view
                v-else
                class="voice-input-btn"
                @touchstart="startRecording"
                @touchend="stopRecording"
                @touchcancel="cancelRecording"
            >
                按住说话
            </view>

            <!-- 表情按钮 -->
            <view class="function-btn" @tap="toggleEmoji">
                <text class="iconfont icon-emoji"></text>
            </view>

            <!-- 更多按钮 -->
            <view v-if="!inputText.length" class="function-btn" @tap="toggleMore">
                <text class="iconfont icon-plus"></text>
            </view>
            <!-- 发送按钮 -->
            <view v-else class="send-btn" @tap="sendMessage">
                发送
            </view>
        </view>

        <!-- 更多功能面板 -->
        <view
            v-if="showMore"
            class="more-panel"
            :style="{ bottom: keyboardHeight + 'px' }"
        >
            <view class="grid">
                <view
                    v-for="(item, index) in moreItems"
                    :key="index"
                    class="grid-item"
                    @tap="handleMoreItemTap(item)"
                >
                    <view class="icon-box">
                        <text class="iconfont" :class="item.icon"></text>
                    </view>
                    <text class="name">{{ item.name }}</text>
                </view>
            </view>
        </view>

        <!-- 表情面板 -->
        <view
            v-if="showEmoji"
            class="emoji-panel"
            :style="{ bottom: keyboardHeight + 'px' }"
        >
            <!-- 表情网格 -->
            <scroll-view class="emoji-grid" scroll-y>
                <view class="emoji-list">
                    <!-- 表情列表 -->
                </view>
            </scroll-view>
        </view>

        <!-- 录音提示 -->
        <view v-if="isRecording" class="recording-tip">
            <view class="recording-wave"></view>
            <text>松开发送，上滑取消</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MessageType, MessageStatus, type Message } from '@/types/message';
import { ChatType } from '@/types/chat';
import dayjs from 'dayjs';

// 聊天信息
const chatInfo = ref({
    id: '',
    name: '',
    type: ChatType.SINGLE,
    online: true,
    typing: false
});

// 消息列表
const messages = ref<Message[]>([]);
// 是否正在加载更多
const isLoading = ref(false);
// 是否正在刷新
const isRefreshing = ref(false);
// 最新消息ID
const latestMessageId = ref('');
// 键盘高度
const keyboardHeight = ref(0);
// 输入文本
const inputText = ref('');
// 是否显示更多面板
const showMore = ref(false);
// 是否显示表情面板
const showEmoji = ref(false);
// 是否使用语音输入
const isVoiceInput = ref(false);
// 是否正在录音
const isRecording = ref(false);

// 更多功能项
const moreItems = [
    { icon: 'icon-image', name: '图片' },
    { icon: 'icon-camera', name: '拍摄' },
    { icon: 'icon-file', name: '文件' },
    { icon: 'icon-location', name: '位置' }
];

// ... 其他代码和方法实现 ...

</script>

<style lang="scss">
.chat-container {
    height: 100vh;
    background-color: #f8f9fa;
    display: flex;
    flex-direction: column;

    .custom-nav {
        height: 88rpx;
        background-color: #fff;
        display: flex;
        align-items: center;
        padding: 0 30rpx;
        position: relative;

        .left {
            width: 88rpx;
            display: flex;
            align-items: center;

            .icon-back {
                font-size: 40rpx;
                color: #2d3436;
            }
        }

        .center {
            flex: 1;
            text-align: center;

            .title {
                font-size: 34rpx;
                color: #2d3436;
                font-weight: 500;
            }

            .subtitle {
                font-size: 24rpx;
                color: #8a8a8a;
                margin-top: 4rpx;
            }
        }

        .right {
            width: 88rpx;
            display: flex;
            align-items: center;
            justify-content: flex-end;

            .icon-more {
                font-size: 40rpx;
                color: #2d3436;
            }
        }
    }

    .message-list {
        flex: 1;
        padding: 20rpx;

        .date-divider {
            text-align: center;
            margin: 20rpx 0;
            
            text {
                font-size: 24rpx;
                color: #8a8a8a;
                background-color: rgba(0, 0, 0, 0.1);
                padding: 4rpx 16rpx;
                border-radius: 12rpx;
            }
        }

        .message-item {
            display: flex;
            margin-bottom: 30rpx;

            &.message-self {
                flex-direction: row-reverse;

                .message-content {
                    align-items: flex-end;
                    margin-right: 20rpx;
                    margin-left: 100rpx;

                    .bubble {
                        background: linear-gradient(45deg, #6c5ce7, #a363d9);
                        color: #fff;

                        &::after {
                            right: -16rpx;
                            border-left-color: #6c5ce7;
                        }
                    }
                }
            }

            .avatar {
                width: 80rpx;
                height: 80rpx;
                border-radius: 20rpx;
            }

            .message-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                margin-left: 20rpx;
                margin-right: 100rpx;

                .sender-name {
                    font-size: 24rpx;
                    color: #8a8a8a;
                    margin-bottom: 8rpx;
                }

                .bubble {
                    max-width: 60%;
                    padding: 20rpx;
                    background-color: #fff;
                    border-radius: 20rpx;
                    position: relative;
                    align-self: flex-start;

                    &::after {
                        content: '';
                        position: absolute;
                        top: 20rpx;
                        left: -16rpx;
                        border: 8rpx solid transparent;
                        border-right-color: #fff;
                    }

                    .text-content {
                        font-size: 30rpx;
                        line-height: 1.4;
                    }

                    .image-content {
                        max-width: 400rpx;
                        border-radius: 12rpx;
                    }

                    .audio-content {
                        display: flex;
                        align-items: center;
                        min-width: 120rpx;

                        .icon-voice {
                            font-size: 40rpx;
                            margin-right: 12rpx;
                        }

                        .duration {
                            font-size: 28rpx;
                        }
                    }

                    .file-content {
                        display: flex;
                        align-items: center;

                        .icon-file {
                            font-size: 80rpx;
                            margin-right: 20rpx;
                        }

                        .file-info {
                            .file-name {
                                font-size: 28rpx;
                                color: #2d3436;
                            }

                            .file-size {
                                font-size: 24rpx;
                                color: #8a8a8a;
                                margin-top: 4rpx;
                            }
                        }
                    }
                }

                .message-status {
                    font-size: 24rpx;
                    margin-top: 8rpx;

                    .status-sending {
                        color: #8a8a8a;
                    }

                    .status-failed {
                        color: #ff3b30;
                    }
                }
            }
        }
    }

    .input-area {
        background-color: #fff;
        padding: 20rpx;
        display: flex;
        align-items: center;
        border-top: 2rpx solid #f5f6fa;

        .function-btn {
            width: 68rpx;
            height: 68rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            .iconfont {
                font-size: 48rpx;
                color: #8a8a8a;
            }
        }

        .text-input-box {
            flex: 1;
            margin: 0 20rpx;
            
            .text-input {
                width: 100%;
                min-height: 68rpx;
                max-height: 160rpx;
                background-color: #f5f6fa;
                border-radius: 34rpx;
                padding: 16rpx 30rpx;
                font-size: 30rpx;
                line-height: 36rpx;
            }
        }

        .voice-input-btn {
            flex: 1;
            height: 68rpx;
            margin: 0 20rpx;
            background-color: #f5f6fa;
            border-radius: 34rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30rpx;
            color: #2d3436;
        }

        .send-btn {
            width: 120rpx;
            height: 68rpx;
            background: linear-gradient(45deg, #6c5ce7, #a363d9);
            border-radius: 34rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30rpx;
            color: #fff;
        }
    }

    .more-panel, .emoji-panel {
        height: 440rpx;
        background-color: #f8f9fa;
        padding: 30rpx;

        .grid {
            display: flex;
            flex-wrap: wrap;

            .grid-item {
                width: 25%;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 40rpx;

                .icon-box {
                    width: 100rpx;
                    height: 100rpx;
                    background-color: #fff;
                    border-radius: 20rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 12rpx;

                    .iconfont {
                        font-size: 48rpx;
                        color: #6c5ce7;
                    }
                }

                .name {
                    font-size: 24rpx;
                    color: #8a8a8a;
                }
            }
        }
    }

    .recording-tip {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 300rpx;
        height: 300rpx;
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 20rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .recording-wave {
            width: 120rpx;
            height: 120rpx;
            border-radius: 50%;
            background-color: #6c5ce7;
            margin-bottom: 20rpx;
            animation: wave 1.5s infinite;
        }

        text {
            font-size: 28rpx;
            color: #fff;
        }
    }
}

@keyframes wave {
    0% {
        transform: scale(0.8);
        opacity: 1;
    }
    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}
</style> 