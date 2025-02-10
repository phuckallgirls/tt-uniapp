<template>
    <view class="chat-container">
        <!-- 聊天标题栏 -->
        <view class="chat-header">
            <view class="user-info">
                <text class="nickname">{{ targetUser.nickname }}</text>
                <text class="status" v-if="targetUser.status === UserStatus.ONLINE">在线</text>
            </view>
            <view class="header-actions">
                <text class="iconfont icon-phone" @tap="handleVoiceCall"></text>
                <text class="iconfont icon-more" @tap="handleMoreActions"></text>
            </view>
        </view>

        <!-- 聊天内容区 -->
        <scroll-view
            class="chat-content"
            scroll-y
            :scroll-top="scrollTop"
            :scroll-into-view="scrollToMessageId"
            @scrolltoupper="loadMoreMessages"
            :refresher-enabled="true"
            :refresher-triggered="isRefreshing"
            @refresherrefresh="handleRefresh"
        >
            <!-- 加载更多提示 -->
            <view class="loading-more" v-if="isLoading">
                <text>正在加载...</text>
            </view>

            <!-- 消息列表 -->
            <view class="message-list">
                <block v-for="(message, index) in messages" :key="message.id">
                    <!-- 日期分割线 -->
                    <view class="date-divider" v-if="shouldShowDate(message, index)">
                        <text>{{ formatDate(message.timestamp) }}</text>
                    </view>

                    <!-- 消息气泡 -->
                    <view 
                        :id="message.id"
                        class="message-item"
                        :class="[message.from === userStore.userInfo?.userid ? 'self' : 'other']"
                    >
                        <!-- 头像 -->
                        <image 
                            class="avatar"
                            :src="message.from === userStore.userInfo?.userid ? 
                                userStore.userInfo?.avatar : targetUser.avatar"
                            mode="aspectFill"
                            @tap="handleAvatarTap(message.from)"
                        />

                        <!-- 消息内容 -->
                        <view class="message-content">
                            <!-- 文本消息 -->
                            <view 
                                v-if="message.type === MessageType.TEXT"
                                class="text-message"
                                :class="{ 'self': message.from === userStore.userInfo?.userid }"
                            >
                                <text class="text" @longpress="handleMessageLongPress(message)">
                                    {{ message.content }}
                                </text>
                            </view>

                            <!-- 图片消息 -->
                            <view 
                                v-else-if="message.type === MessageType.IMAGE"
                                class="image-message"
                                @tap="handleImagePreview(message)"
                            >
                                <image 
                                    class="image"
                                    :src="message.content.thumbnail || message.content.url"
                                    :style="{
                                        width: getImageSize(message.content).width + 'rpx',
                                        height: getImageSize(message.content).height + 'rpx'
                                    }"
                                    mode="aspectFill"
                                />
                            </view>

                            <!-- 语音消息 -->
                            <view 
                                v-else-if="message.type === MessageType.VOICE"
                                class="voice-message"
                                @tap="handleVoicePlay(message)"
                            >
                                <text class="iconfont" :class="[
                                    isPlayingVoice(message.id) ? 'icon-pause' : 'icon-play'
                                ]"></text>
                                <text class="duration">{{ formatDuration(message.content.duration) }}</text>
                            </view>

                            <!-- 视频消息 -->
                            <view 
                                v-else-if="message.type === MessageType.VIDEO"
                                class="video-message"
                                @tap="handleVideoPlay(message)"
                            >
                                <image 
                                    class="thumbnail"
                                    :src="message.content.thumbnail"
                                    mode="aspectFill"
                                />
                                <view class="play-icon">
                                    <text class="iconfont icon-play"></text>
                                </view>
                                <text class="duration">{{ formatDuration(message.content.duration) }}</text>
                            </view>

                            <!-- 文件消息 -->
                            <view 
                                v-else-if="message.type === MessageType.FILE"
                                class="file-message"
                                @tap="handleFileOpen(message)"
                            >
                                <text class="iconfont icon-file"></text>
                                <view class="file-info">
                                    <text class="filename">{{ message.content.name }}</text>
                                    <text class="filesize">{{ formatFileSize(message.content.size) }}</text>
                                </view>
                            </view>

                            <!-- 消息状态 -->
                            <view class="message-status" v-if="message.from === userStore.userInfo?.userid">
                                <text v-if="message.status === 'sending'" class="status sending">发送中...</text>
                                <text v-else-if="message.status === 'failed'" class="status failed">发送失败</text>
                                <text v-else-if="message.status === 'read'" class="status read">已读</text>
                            </view>
                        </view>
                    </view>
                </block>
            </view>
        </scroll-view>

        <!-- 输入工具栏 -->
        <view class="chat-toolbar" :style="{ bottom: keyboardHeight + 'px' }">
            <!-- 语音/文字切换按钮 -->
            <text 
                class="iconfont"
                :class="[isVoiceMode ? 'icon-keyboard' : 'icon-voice']"
                @tap="toggleInputMode"
            ></text>

            <!-- 文本输入框/语音录制按钮 -->
            <view class="input-wrapper">
                <input
                    v-if="!isVoiceMode"
                    class="text-input"
                    v-model="inputText"
                    :focus="inputFocus"
                    :cursor-spacing="20"
                    @focus="handleInputFocus"
                    @blur="handleInputBlur"
                    @confirm="handleSendText"
                    placeholder="输入消息..."
                />
                <button
                    v-else
                    class="voice-button"
                    :class="{ recording: isRecording }"
                    @touchstart="handleVoiceStart"
                    @touchend="handleVoiceEnd"
                    @touchcancel="handleVoiceCancel"
                >
                    {{ isRecording ? '松开发送' : '按住说话' }}
                </button>
            </view>

            <!-- 表情按钮 -->
            <text 
                class="iconfont icon-emoji"
                @tap="toggleEmojiPanel"
            ></text>

            <!-- 更多功能按钮 -->
            <text 
                class="iconfont icon-plus"
                @tap="toggleMorePanel"
            ></text>
        </view>

        <!-- 表情面板 -->
        <view 
            class="emoji-panel"
            v-if="showEmojiPanel"
            :style="{ bottom: keyboardHeight + 'px' }"
        >
            <scroll-view class="emoji-list" scroll-y>
                <view 
                    v-for="(emoji, index) in emojiList"
                    :key="index"
                    class="emoji-item"
                    @tap="handleEmojiSelect(emoji)"
                >
                    {{ emoji }}
                </view>
            </scroll-view>
        </view>

        <!-- 更多功能面板 -->
        <view 
            class="more-panel"
            v-if="showMorePanel"
            :style="{ bottom: keyboardHeight + 'px' }"
        >
            <view class="action-list">
                <view class="action-item" @tap="handleChooseImage">
                    <text class="iconfont icon-image"></text>
                    <text class="text">图片</text>
                </view>
                <view class="action-item" @tap="handleTakePhoto">
                    <text class="iconfont icon-camera"></text>
                    <text class="text">拍摄</text>
                </view>
                <view class="action-item" @tap="handleChooseFile">
                    <text class="iconfont icon-file"></text>
                    <text class="text">文件</text>
                </view>
            </view>
        </view>

        <!-- 录音动画 -->
        <view class="recording-popup" v-if="isRecording">
            <view class="recording-animation">
                <text class="iconfont icon-mic"></text>
                <view class="wave-list">
                    <view 
                        v-for="i in 5"
                        :key="i"
                        class="wave"
                        :style="{ height: getRandomHeight() + 'rpx' }"
                    ></view>
                </view>
            </view>
            <text class="recording-tip">上滑取消</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { MessageType, type ChatMessage } from '@/types/message';
import { UserStatus } from '@/types/user';
import { messageManager } from '@/utils/message';
import { uploadManager } from '@/utils/upload';
import dayjs from 'dayjs';
import { useChatStore } from '../../stores/chat';

const userStore = useUserStore();
const messages = ref<ChatMessage[]>([]);
const targetUser = ref({
    userid: '',
    nickname: '',
    avatar: '',
    status: UserStatus.OFFLINE
});

// 输入相关
const inputText = ref('');
const inputFocus = ref(false);
const isVoiceMode = ref(false);
const isRecording = ref(false);
const keyboardHeight = ref(0);

// 面板控制
const showEmojiPanel = ref(false);
const showMorePanel = ref(false);

// 滚动控制
const scrollTop = ref(0);
const scrollToMessageId = ref('');
const isRefreshing = ref(false);
const isLoading = ref(false);
const hasMore = ref(true);

// 语音播放
const currentPlayingVoice = ref('');
const audioContext = uni.createInnerAudioContext();

// 初始化
onMounted(async () => {
    const { userid } = userStore.userInfo!;
    const { targetId } = getCurrentPages().pop()?.options || {};
    
    if (!targetId) {
        uni.navigateBack();
        return;
    }

    // 获取目标用户信息
    await loadTargetUser(targetId);
    
    // 加载历史消息
    await loadHistoryMessages();

    // 注册消息监听
    messageManager.on('onMessage', handleReceiveMessage);
    messageManager.on('onMessageStatus', handleMessageStatus);
    messageManager.on('onMessageRecall', handleMessageRecall);

    // 监听键盘高度变化
    uni.onKeyboardHeightChange((res) => {
        keyboardHeight.value = res.height;
        if (res.height === 0) {
            showEmojiPanel.value = false;
            showMorePanel.value = false;
        }
        scrollToBottom();
    });

    const chatStore = useChatStore();
    await chatStore.loadMessages(targetId, true);
});

onUnmounted(() => {
    messageManager.off('onMessage', handleReceiveMessage);
    messageManager.off('onMessageStatus', handleMessageStatus);
    messageManager.off('onMessageRecall', handleMessageRecall);
    audioContext.destroy();
});

// 加载目标用户信息
const loadTargetUser = async (targetId: string) => {
    try {
        // TODO: 通过 WebSocket 获取用户信息
        // const response = await getUserInfo(targetId);
        // targetUser.value = response.data;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        uni.showToast({
            title: '获取用户信息失败',
            icon: 'none'
        });
    }
};

// 加载历史消息
const loadHistoryMessages = async () => {
    if (!hasMore.value || isLoading.value) return;
    
    try {
        isLoading.value = true;
        // TODO: 通过 WebSocket 获取历史消息
        // const response = await getHistoryMessages({
        //     targetId: targetUser.value.userid,
        //     before: messages.value[0]?.timestamp,
        //     limit: 20
        // });
        // messages.value.unshift(...response.data);
        // hasMore.value = response.data.length === 20;
    } catch (error) {
        console.error('加载历史消息失败:', error);
    } finally {
        isLoading.value = false;
        isRefreshing.value = false;
    }
};

// 发送文本消息
const handleSendText = async () => {
    if (!inputText.value.trim()) return;

    const message: ChatMessage = {
        id: Date.now().toString(),
        type: MessageType.TEXT,
        from: userStore.userInfo!.userid,
        to: targetUser.value.userid,
        chatType: ChatType.SINGLE,
        content: inputText.value,
        timestamp: Date.now(),
        status: 'sending'
    };

    messages.value.push(message);
    scrollToBottom();
    inputText.value = '';

    try {
        await messageManager.sendMessage(message);
    } catch (error) {
        console.error('发送消息失败:', error);
        const index = messages.value.findIndex(m => m.id === message.id);
        if (index !== -1) {
            messages.value[index].status = 'failed';
        }
    }
};

// 发送图片消息
const handleChooseImage = async () => {
    try {
        const filePath = await uploadManager.chooseFile(UploadType.IMAGE);
        const result = await uploadManager.uploadFile(filePath, UploadType.IMAGE, {
            onProgress: (progress) => {
                console.log('上传进度:', progress);
            }
        });

        const message: ChatMessage = {
            id: Date.now().toString(),
            type: MessageType.IMAGE,
            from: userStore.userInfo!.userid,
            to: targetUser.value.userid,
            chatType: ChatType.SINGLE,
            content: {
                url: result.url,
                thumbnail: result.url,
                width: 0,  // TODO: 获取实际尺寸
                height: 0,
                size: result.size
            },
            timestamp: Date.now(),
            status: 'sending'
        };

        messages.value.push(message);
        scrollToBottom();
        await messageManager.sendMessage(message);
    } catch (error) {
        console.error('发送图片失败:', error);
        uni.showToast({
            title: '发送图片失败',
            icon: 'none'
        });
    }
};

// 发送语音消息
const handleVoiceStart = () => {
    isRecording.value = true;
    recorderManager.start({
        duration: 60000, // 最长录音时间，单位ms
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'mp3'
    });
};

const handleVoiceEnd = () => {
    isRecording.value = false;
    recorderManager.stop();
};

const handleVoiceCancel = () => {
    isRecording.value = false;
    recorderManager.stop();
};

// 录音管理器
const recorderManager = uni.getRecorderManager();
recorderManager.onStop(async (res) => {
    try {
        const result = await uploadManager.uploadFile(res.tempFilePath, UploadType.VOICE);
        
        const message: ChatMessage = {
            id: Date.now().toString(),
            type: MessageType.VOICE,
            from: userStore.userInfo!.userid,
            to: targetUser.value.userid,
            chatType: ChatType.SINGLE,
            content: {
                url: result.url,
                duration: Math.ceil(res.duration / 1000), // 转换为秒
                size: result.size
            },
            timestamp: Date.now(),
            status: 'sending'
        };

        messages.value.push(message);
        scrollToBottom();
        await messageManager.sendMessage(message);
    } catch (error) {
        console.error('发送语音失败:', error);
        uni.showToast({
            title: '发送语音失败',
            icon: 'none'
        });
    }
});

// 发送视频消息
const handleTakePhoto = async () => {
    try {
        const res = await new Promise((resolve, reject) => {
            uni.chooseVideo({
                sourceType: ['camera'],
                compressed: true,
                success: resolve,
                fail: reject
            });
        });

        const result = await uploadManager.uploadFile(res.tempFilePath, UploadType.VIDEO);
        
        const message: ChatMessage = {
            id: Date.now().toString(),
            type: MessageType.VIDEO,
            from: userStore.userInfo!.userid,
            to: targetUser.value.userid,
            chatType: ChatType.SINGLE,
            content: {
                url: result.url,
                thumbnail: result.thumbnail || '', // 视频封面
                duration: res.duration,
                size: result.size
            },
            timestamp: Date.now(),
            status: 'sending'
        };

        messages.value.push(message);
        scrollToBottom();
        await messageManager.sendMessage(message);
    } catch (error) {
        console.error('发送视频失败:', error);
        uni.showToast({
            title: '发送视频失败',
            icon: 'none'
        });
    }
};

// 发送文件消息
const handleChooseFile = async () => {
    try {
        const filePath = await uploadManager.chooseFile(UploadType.FILE);
        const result = await uploadManager.uploadFile(filePath, UploadType.FILE);

        const message: ChatMessage = {
            id: Date.now().toString(),
            type: MessageType.FILE,
            from: userStore.userInfo!.userid,
            to: targetUser.value.userid,
            chatType: ChatType.SINGLE,
            content: {
                url: result.url,
                name: result.name,
                size: result.size,
                ext: result.type
            },
            timestamp: Date.now(),
            status: 'sending'
        };

        messages.value.push(message);
        scrollToBottom();
        await messageManager.sendMessage(message);
    } catch (error) {
        console.error('发送文件失败:', error);
        uni.showToast({
            title: '发送文件失败',
            icon: 'none'
        });
    }
};

// 处理消息长按
const handleMessageLongPress = (message: ChatMessage) => {
    uni.showActionSheet({
        itemList: ['复制', '转发', '撤回', '删除'],
        success: (res) => {
            switch (res.tapIndex) {
                case 0: // 复制
                    if (message.type === MessageType.TEXT) {
                        uni.setClipboardData({
                            data: message.content,
                            success: () => {
                                uni.showToast({
                                    title: '已复制',
                                    icon: 'none'
                                });
                            }
                        });
                    }
                    break;
                case 1: // 转发
                    // TODO: 实现转发功能
                    break;
                case 2: // 撤回
                    if (message.from === userStore.userInfo?.userid) {
                        handleRecallMessage(message);
                    }
                    break;
                case 3: // 删除
                    handleDeleteMessage(message);
                    break;
            }
        }
    });
};

// 撤回消息
const handleRecallMessage = async (message: ChatMessage) => {
    try {
        await messageManager.recallMessage(message.id, targetUser.value.userid);
        const index = messages.value.findIndex(m => m.id === message.id);
        if (index !== -1) {
            messages.value[index] = {
                ...message,
                type: MessageType.SYSTEM,
                content: {
                    action: 'recall',
                    data: null
                }
            };
        }
    } catch (error) {
        console.error('撤回消息失败:', error);
        uni.showToast({
            title: '撤回消息失败',
            icon: 'none'
        });
    }
};

// 删除消息
const handleDeleteMessage = (message: ChatMessage) => {
    const index = messages.value.findIndex(m => m.id === message.id);
    if (index !== -1) {
        messages.value.splice(index, 1);
    }
};

// 处理语音播放
const handleVoicePlay = (message: ChatMessage) => {
    if (message.type !== MessageType.VOICE) return;
    
    if (currentPlayingVoice.value === message.id) {
        audioContext.stop();
        currentPlayingVoice.value = '';
    } else {
        audioContext.stop();
        audioContext.src = message.content.url;
        audioContext.play();
        currentPlayingVoice.value = message.id;
    }
};

// 处理图片预览
const handleImagePreview = (message: ChatMessage) => {
    if (message.type !== MessageType.IMAGE) return;
    
    uni.previewImage({
        urls: [message.content.url],
        current: message.content.url
    });
};

// 处理文件打开
const handleFileOpen = (message: ChatMessage) => {
    if (message.type !== MessageType.FILE) return;
    
    uni.downloadFile({
        url: message.content.url,
        success: (res) => {
            uni.openDocument({
                filePath: res.tempFilePath,
                success: () => {
                    console.log('打开文件成功');
                },
                fail: () => {
                    uni.showToast({
                        title: '无法打开此类型文件',
                        icon: 'none'
                    });
                }
            });
        },
        fail: () => {
            uni.showToast({
                title: '文件下载失败',
                icon: 'none'
            });
        }
    });
};

// 工具函数
const scrollToBottom = () => {
    nextTick(() => {
        const query = uni.createSelectorQuery();
        query.select('.message-list').boundingClientRect((rect) => {
            if (rect) {
                scrollTop.value = rect.height;
            }
        }).exec();
    });
};

const formatDate = (timestamp: number) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
};

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
};

const getImageSize = (content: { width: number; height: number }) => {
    const maxWidth = 400;
    const maxHeight = 300;
    let { width, height } = content;

    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }

    return { width, height };
};

const loadMoreMessages = async () => {
    const chatStore = useChatStore();
    await chatStore.loadMessages(targetUser.value.userid);
};
</script>

<style lang="scss">
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f8f9fa;

    .chat-header {
        height: 88rpx;
        background-color: #fff;
        border-bottom: 2rpx solid #f5f6fa;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 30rpx;
        position: relative;
        z-index: 100;

        .user-info {
            display: flex;
            align-items: center;

            .nickname {
                font-size: 32rpx;
                color: #2d3436;
                font-weight: 500;
                margin-right: 12rpx;
            }

            .status {
                font-size: 24rpx;
                color: #00b894;
            }
        }

        .header-actions {
            display: flex;
            align-items: center;

            .iconfont {
                font-size: 40rpx;
                color: #2d3436;
                padding: 20rpx;

                &:last-child {
                    padding-right: 0;
                }
            }
        }
    }

    .chat-content {
        flex: 1;
        overflow: hidden;
        padding: 20rpx 30rpx;

        .message-list {
            padding-bottom: 20rpx;

            .date-divider {
                text-align: center;
                margin: 20rpx 0;

                text {
                    font-size: 24rpx;
                    color: #8a8a8a;
                    background-color: rgba(0, 0, 0, 0.1);
                    padding: 4rpx 12rpx;
                    border-radius: 8rpx;
                }
            }

            .message-item {
                display: flex;
                margin-bottom: 30rpx;

                &.self {
                    flex-direction: row-reverse;

                    .message-content {
                        margin-right: 20rpx;
                        margin-left: 100rpx;

                        .text-message {
                            background: linear-gradient(45deg, #6c5ce7, #a363d9);
                            color: #fff;

                            &::after {
                                right: -16rpx;
                                border-left-color: #6c5ce7;
                            }
                        }
                    }
                }

                &.other {
                    .message-content {
                        margin-left: 20rpx;
                        margin-right: 100rpx;

                        .text-message {
                            background-color: #fff;
                            color: #2d3436;

                            &::after {
                                left: -16rpx;
                                border-right-color: #fff;
                            }
                        }
                    }
                }

                .avatar {
                    width: 80rpx;
                    height: 80rpx;
                    border-radius: 40rpx;
                }

                .message-content {
                    .text-message {
                        padding: 20rpx;
                        border-radius: 12rpx;
                        position: relative;
                        word-break: break-all;
                        font-size: 28rpx;
                        line-height: 1.4;

                        &::after {
                            content: '';
                            position: absolute;
                            top: 24rpx;
                            border: 8rpx solid transparent;
                        }
                    }

                    .image-message {
                        .image {
                            border-radius: 12rpx;
                            background-color: #f5f6fa;
                        }
                    }

                    .voice-message {
                        background-color: #fff;
                        padding: 20rpx;
                        border-radius: 12rpx;
                        display: flex;
                        align-items: center;
                        min-width: 120rpx;

                        .iconfont {
                            font-size: 40rpx;
                            margin-right: 12rpx;
                        }

                        .duration {
                            font-size: 24rpx;
                            color: #8a8a8a;
                        }
                    }

                    .video-message {
                        position: relative;
                        width: 320rpx;
                        height: 240rpx;
                        border-radius: 12rpx;
                        overflow: hidden;

                        .thumbnail {
                            width: 100%;
                            height: 100%;
                        }

                        .play-icon {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                            width: 80rpx;
                            height: 80rpx;
                            background-color: rgba(0, 0, 0, 0.5);
                            border-radius: 40rpx;
                            display: flex;
                            align-items: center;
                            justify-content: center;

                            .iconfont {
                                font-size: 40rpx;
                                color: #fff;
                            }
                        }

                        .duration {
                            position: absolute;
                            right: 12rpx;
                            bottom: 12rpx;
                            font-size: 24rpx;
                            color: #fff;
                            text-shadow: 0 0 4rpx rgba(0, 0, 0, 0.5);
                        }
                    }

                    .file-message {
                        background-color: #fff;
                        padding: 20rpx;
                        border-radius: 12rpx;
                        display: flex;
                        align-items: center;
                        max-width: 400rpx;

                        .iconfont {
                            font-size: 60rpx;
                            color: #6c5ce7;
                            margin-right: 20rpx;
                        }

                        .file-info {
                            flex: 1;
                            overflow: hidden;

                            .filename {
                                font-size: 28rpx;
                                color: #2d3436;
                                @include text-ellipsis;
                            }

                            .filesize {
                                font-size: 24rpx;
                                color: #8a8a8a;
                                margin-top: 4rpx;
                            }
                        }
                    }

                    .message-status {
                        font-size: 24rpx;
                        margin-top: 8rpx;
                        text-align: right;

                        .status {
                            &.sending {
                                color: #8a8a8a;
                            }

                            &.failed {
                                color: #ff3b30;
                            }

                            &.read {
                                color: #6c5ce7;
                            }
                        }
                    }
                }
            }
        }
    }

    .chat-toolbar {
        background-color: #fff;
        border-top: 2rpx solid #f5f6fa;
        padding: 20rpx;
        display: flex;
        align-items: center;
        position: relative;
        z-index: 100;

        .iconfont {
            font-size: 48rpx;
            color: #2d3436;
            padding: 0 20rpx;
        }

        .input-wrapper {
            flex: 1;
            margin: 0 20rpx;

            .text-input {
                background-color: #f5f6fa;
                height: 72rpx;
                border-radius: 36rpx;
                padding: 0 30rpx;
                font-size: 28rpx;
            }

            .voice-button {
                width: 100%;
                height: 72rpx;
                background-color: #f5f6fa;
                border-radius: 36rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28rpx;
                color: #2d3436;

                &.recording {
                    background-color: #6c5ce7;
                    color: #fff;
                }
            }
        }
    }

    .emoji-panel, .more-panel {
        height: 400rpx;
        background-color: #fff;
        border-top: 2rpx solid #f5f6fa;
        position: relative;
        z-index: 100;
    }

    .recording-popup {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 20rpx;
        padding: 40rpx;
        display: flex;
        flex-direction: column;
        align-items: center;

        .recording-animation {
            display: flex;
            align-items: center;
            margin-bottom: 20rpx;

            .iconfont {
                font-size: 80rpx;
                color: #fff;
                margin-right: 20rpx;
            }

            .wave-list {
                display: flex;
                align-items: flex-end;

                .wave {
                    width: 8rpx;
                    background-color: #fff;
                    margin: 0 4rpx;
                    border-radius: 4rpx;
                    animation: wave 1s ease-in-out infinite;

                    @for $i from 1 through 5 {
                        &:nth-child(#{$i}) {
                            animation-delay: $i * 0.1s;
                        }
                    }
                }
            }
        }

        .recording-tip {
            font-size: 28rpx;
            color: #fff;
        }
    }
}

@keyframes wave {
    0%, 100% {
        height: 20rpx;
    }
    50% {
        height: 40rpx;
    }
}
</style> 