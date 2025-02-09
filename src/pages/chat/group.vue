<template>
    <view class="chat-container">
        <!-- 群聊标题栏 -->
        <view class="chat-header">
            <view class="group-info" @tap="navigateToGroupDetail">
                <text class="name">{{ groupInfo.name }}</text>
                <text class="member-count">({{ groupInfo.memberCount }})</text>
            </view>
            <view class="header-actions">
                <text class="iconfont icon-group" @tap="handleShowMembers"></text>
                <text class="iconfont icon-more" @tap="handleMoreActions"></text>
            </view>
        </view>

        <!-- 聊天内容区 -->
        <scroll-view
            class="chat-content"
            scroll-y
            :scroll-top="scrollTop"
            :scroll-into-view="scrollToMessageId"
            @scrolltoupper="handleLoadHistory"
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
                            :src="getMemberAvatar(message.from)"
                            mode="aspectFill"
                            @tap="handleAvatarTap(message.from)"
                        />

                        <!-- 用户名 -->
                        <text 
                            v-if="message.from !== userStore.userInfo?.userid"
                            class="nickname"
                        >
                            {{ getMemberNickname(message.from) }}
                        </text>

                        <!-- 消息内容 -->
                        <view class="message-content">
                            <!-- 文本消息（支持@） -->
                            <view 
                                v-if="message.type === MessageType.TEXT"
                                class="text-message"
                                :class="{ 'self': message.from === userStore.userInfo?.userid }"
                            >
                                <rich-text 
                                    class="text"
                                    :nodes="parseTextMessage(message.content)"
                                    @longpress="handleMessageLongPress(message)"
                                ></rich-text>
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

                            <!-- 系统消息 -->
                            <view 
                                v-else-if="message.type === MessageType.SYSTEM"
                                class="system-message"
                            >
                                <text class="text">{{ formatSystemMessage(message.content) }}</text>
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

            <!-- @按钮 -->
            <text 
                class="iconfont icon-at"
                @tap="handleShowAtList"
            ></text>

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

        <!-- @成员列表 -->
        <uni-popup ref="atPopup" type="bottom">
            <view class="at-member-list">
                <view class="title">选择提醒的人</view>
                <scroll-view scroll-y class="member-scroll">
                    <view 
                        class="member-item"
                        v-for="member in groupMembers"
                        :key="member.userId"
                        @tap="handleAtMember(member)"
                    >
                        <image class="avatar" :src="member.avatar" mode="aspectFill" />
                        <text class="nickname">{{ member.nickname }}</text>
                        <text class="role-tag" v-if="member.role === GroupRole.OWNER">群主</text>
                        <text class="role-tag admin" v-else-if="member.role === GroupRole.ADMIN">管理员</text>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

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
import { MessageType, ChatType, type ChatMessage } from '@/types/message';
import { GroupRole, type GroupMember } from '@/types/group';
import { messageManager } from '@/utils/message';
import { uploadManager } from '@/utils/upload';
import dayjs from 'dayjs';
import { onLoad } from '@dcloudio/uni-app';
import type { GroupInfo } from '@/types/group';

const userStore = useUserStore();
const messages = ref<ChatMessage[]>([]);
const groupInfo = ref<GroupInfo>({
    id: '',
    name: '',
    avatar: '',
    memberCount: 0,
    notice: ''
});
const groupMembers = ref<GroupMember[]>([]);

// 输入相关
const inputText = ref('');
const inputFocus = ref(false);
const isVoiceMode = ref(false);
const isRecording = ref(false);
const keyboardHeight = ref(0);
const atPopup = ref<any>(null);

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

// 录音管理器初始化
const initRecorder = () => {
    // #ifndef H5
    const recorderManager = uni.getRecorderManager();
    if (recorderManager) {
        recorderManager.onStop((res) => {
            // 处理录音结束
            console.log('录音结束:', res);
        });
    }
    // #endif
};

// 初始化
onMounted(async () => {
    const { groupId } = getCurrentPages().pop()?.options || {};
    
    if (!groupId) {
        uni.navigateBack();
        return;
    }

    // 获取群组信息
    await loadGroupInfo(groupId);
    
    // 获取群成员列表
    await loadGroupMembers();
    
    // 加载历史消息
    await loadHistoryMessages();

    // 注册消息监听
    messageManager.on('onMessage', handleReceiveMessage);
    messageManager.on('onMessageStatus', handleMessageStatus);
    messageManager.on('onMessageRecall', handleMessageRecall);
    messageManager.on('onGroupMemberUpdate', handleMemberUpdate);

    // 监听键盘高度变化
    uni.onKeyboardHeightChange((res) => {
        keyboardHeight.value = res.height;
        if (res.height === 0) {
            showEmojiPanel.value = false;
            showMorePanel.value = false;
        }
        scrollToBottom();
    });

    // 添加消息监听
    uni.$on('receiveMessage', handleReceiveMessage);

    // 初始化录音管理器
    initRecorder();
});

onUnmounted(() => {
    messageManager.off('onMessage', handleReceiveMessage);
    messageManager.off('onMessageStatus', handleMessageStatus);
    messageManager.off('onMessageRecall', handleMessageRecall);
    messageManager.off('onGroupMemberUpdate', handleMemberUpdate);
    audioContext.destroy();

    // 移除消息监听
    uni.$off('receiveMessage', handleReceiveMessage);
});

// 加载群组信息
const loadGroupInfo = async (groupId: string) => {
    try {
        // TODO: 通过 WebSocket 获取群组信息
        // const response = await getGroupInfo(groupId);
        // groupInfo.value = response.data;
    } catch (error) {
        console.error('获取群组信息失败:', error);
        uni.showToast({
            title: '获取群组信息失败',
            icon: 'none'
        });
    }
};

// 加载群成员列表
const loadGroupMembers = async () => {
    try {
        // TODO: 通过 WebSocket 获取群成员列表
        // const response = await getGroupMembers(groupInfo.value.id);
        // groupMembers.value = response.data;
    } catch (error) {
        console.error('获取群成员列表失败:', error);
    }
};

// 加载历史消息
const loadHistoryMessages = async () => {
    if (!hasMore.value || isLoading.value) return;
    
    try {
        isLoading.value = true;
        // TODO: 通过 WebSocket 获取历史消息
        // const response = await getHistoryMessages({
        //     groupId: groupInfo.value.id,
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

// 获取成员头像
const getMemberAvatar = (userId: number): string => {
    const member = groupMembers.value.find(m => m.userId === userId);
    return member?.avatar || '/static/images/avatar/default.png';
};

// 获取成员昵称
const getMemberNickname = (userId: number): string => {
    const member = groupMembers.value.find(m => m.userId === userId);
    return member?.nickname || '未知用户';
};

// 处理@成员
const handleShowAtList = () => {
    atPopup.value?.open();
};

const handleAtMember = (member: GroupMember) => {
    inputText.value += `@${member.nickname} `;
    atPopup.value?.close();
    inputFocus.value = true;
};

// 解析文本消息（处理@）
const parseTextMessage = (content: string): string => {
    // 将@用户转换为特殊样式
    return content.replace(/@([^ ]+)/g, (match, nickname) => {
        const member = groupMembers.value.find(m => m.nickname === nickname);
        if (member) {
            return `<span class="at-text">@${nickname}</span>`;
        }
        return match;
    });
};

// 格式化系统消息
const formatSystemMessage = (content: { action: string; data: any }): string => {
    switch (content.action) {
        case 'join':
            return `${getMemberNickname(content.data.userId)} 加入群组`;
        case 'leave':
            return `${getMemberNickname(content.data.userId)} 退出群组`;
        case 'kick':
            return `${getMemberNickname(content.data.operatorId)} 将 ${getMemberNickname(content.data.userId)} 移出群组`;
        case 'setAdmin':
            return `${getMemberNickname(content.data.userId)} 被设置为管理员`;
        case 'removeAdmin':
            return `${getMemberNickname(content.data.userId)} 被取消管理员`;
        case 'transfer':
            return `群主已转让给 ${getMemberNickname(content.data.userId)}`;
        case 'recall':
            return '消息已撤回';
        default:
            return '系统消息';
    }
};

// 处理群成员更新
const handleMemberUpdate = (data: { 
    groupId: string; 
    type: 'join' | 'leave' | 'kick' | 'update';
    member: GroupMember;
}) => {
    if (data.groupId !== groupInfo.value.id) return;

    switch (data.type) {
        case 'join':
            groupMembers.value.push(data.member);
            break;
        case 'leave':
        case 'kick':
            const index = groupMembers.value.findIndex(m => m.userId === data.member.userId);
            if (index !== -1) {
                groupMembers.value.splice(index, 1);
            }
            break;
        case 'update':
            const memberIndex = groupMembers.value.findIndex(m => m.userId === data.member.userId);
            if (memberIndex !== -1) {
                groupMembers.value[memberIndex] = data.member;
            }
            break;
    }
};

// 导航到群详情
const navigateToGroupDetail = () => {
    uni.navigateTo({
        url: `/pages/group/detail?id=${groupInfo.value.id}`
    });
};

// 显示群成员列表
const handleShowMembers = () => {
    uni.navigateTo({
        url: `/pages/group/members?id=${groupInfo.value.id}`
    });
};

// 更多操作
const handleMoreActions = () => {
    uni.showActionSheet({
        itemList: ['查看群公告', '清空聊天记录', '退出群组'],
        success: (res) => {
            switch (res.tapIndex) {
                case 0:
                    // TODO: 显示群公告
                    break;
                case 1:
                    handleClearMessages();
                    break;
                case 2:
                    handleLeaveGroup();
                    break;
            }
        }
    });
};

// 清空聊天记录
const handleClearMessages = () => {
    uni.showModal({
        title: '提示',
        content: '确定要清空聊天记录吗？',
        success: (res) => {
            if (res.confirm) {
                messages.value = [];
            }
        }
    });
};

// 退出群组
const handleLeaveGroup = () => {
    uni.showModal({
        title: '提示',
        content: '确定要退出该群组吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    // TODO: 通过 WebSocket 发送退出群组请求
                    // await leaveGroup(groupInfo.value.id);
                    uni.navigateBack();
                } catch (error) {
                    console.error('退出群组失败:', error);
                    uni.showToast({
                        title: '退出群组失败',
                        icon: 'none'
                    });
                }
            }
        }
    });
};

// 发送文本消息
const handleSendText = async () => {
    if (!inputText.value.trim()) return;

    const message: ChatMessage = {
        id: Date.now().toString(),
        type: MessageType.TEXT,
        from: userStore.userInfo!.userid,
        to: groupInfo.value.id,
        chatType: ChatType.GROUP,
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
            to: groupInfo.value.id,
            chatType: ChatType.GROUP,
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
        duration: 60000,
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
            to: groupInfo.value.id,
            chatType: ChatType.GROUP,
            content: {
                url: result.url,
                duration: Math.ceil(res.duration / 1000),
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
            to: groupInfo.value.id,
            chatType: ChatType.GROUP,
            content: {
                url: result.url,
                thumbnail: result.thumbnail || '',
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
            to: groupInfo.value.id,
            chatType: ChatType.GROUP,
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
    const isOwner = message.from === userStore.userInfo?.userid;
    const actions = ['复制'];
    
    if (isOwner) {
        actions.push('撤回');
    }
    actions.push('转发', '删除');

    uni.showActionSheet({
        itemList: actions,
        success: (res) => {
            switch (actions[res.tapIndex]) {
                case '复制':
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
                case '撤回':
                    handleRecallMessage(message);
                    break;
                case '转发':
                    // TODO: 实现转发功能
                    break;
                case '删除':
                    handleDeleteMessage(message);
                    break;
            }
        }
    });
};

// 撤回消息
const handleRecallMessage = async (message: ChatMessage) => {
    try {
        await messageManager.recallMessage(message.id, groupInfo.value.id);
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
        query.select('.message-list').boundingClientRect();
        query.select('.chat-content').boundingClientRect();
        query.exec((res) => {
            if (res[0] && res[1]) {
                const messageListHeight = res[0].height;
                const chatContentHeight = res[1].height;
                scrollTop.value = messageListHeight - chatContentHeight;
            }
        });
    });
};

const getRandomHeight = () => {
    return Math.floor(Math.random() * 20 + 20);
};

const formatDate = (timestamp: number) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
};

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatFileSize = (size: number) => {
    if (size < 1024) {
        return size + 'B';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + 'KB';
    } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(1) + 'MB';
    } else {
        return (size / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
    }
};

// 消息接收处理
const handleReceiveMessage = (message: any) => {
    // TODO: 处理接收到的消息
    console.log('收到消息:', message);
};

// 生命周期
onLoad((options) => {
    const { id, name } = options;
    groupInfo.value = {
        id,
        name: decodeURIComponent(name as string),
        avatar: '/static/images/avatar/group.png',
        memberCount: 0,
        notice: ''
    };
    
    // 初始化录音管理器
    initRecorder();
});
</script>

<style lang="scss">
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f6fa;

    .chat-header {
        background-color: #fff;
        padding: 20rpx 30rpx;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2rpx solid #f5f6fa;

        .group-info {
            flex: 1;
            overflow: hidden;

            .name {
                font-size: 32rpx;
                color: #2d3436;
                margin-right: 12rpx;
            }

            .member-count {
                font-size: 24rpx;
                color: #636e72;
            }
        }

        .header-actions {
            display: flex;
            align-items: center;

            .iconfont {
                font-size: 48rpx;
                color: #2d3436;
                padding: 0 20rpx;
            }
        }
    }

    // ... 其他样式与单聊相同，这里省略 ...

    .at-member-list {
        background-color: #fff;
        border-radius: 20rpx 20rpx 0 0;
        padding: 30rpx;
        max-height: 60vh;

        .title {
            font-size: 32rpx;
            color: #2d3436;
            margin-bottom: 30rpx;
            text-align: center;
        }

        .member-scroll {
            max-height: calc(60vh - 100rpx);
        }

        .member-item {
            display: flex;
            align-items: center;
            padding: 20rpx 0;

            .avatar {
                width: 80rpx;
                height: 80rpx;
                border-radius: 40rpx;
                margin-right: 20rpx;
            }

            .nickname {
                flex: 1;
                font-size: 28rpx;
                color: #2d3436;
            }

            .role-tag {
                padding: 4rpx 12rpx;
                background-color: #6c5ce7;
                border-radius: 8rpx;
                font-size: 24rpx;
                color: #fff;

                &.admin {
                    background-color: #00b894;
                }
            }
        }
    }

    .at-text {
        color: #6c5ce7;
    }
}
</style> 