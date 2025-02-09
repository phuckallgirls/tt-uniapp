<template>
    <view class="message-input">
        <!-- 输入区域 -->
        <view class="input-area">
            <!-- 语音/文字切换按钮 -->
            <view 
                class="mode-switch"
                @tap="handleModeSwitch"
            >
                <text 
                    class="iconfont"
                    :class="isVoiceMode ? 'icon-keyboard' : 'icon-voice'"
                ></text>
            </view>

            <!-- 文本输入框 -->
            <textarea
                v-show="!isVoiceMode"
                class="text-input"
                v-model="inputText"
                :adjust-position="false"
                :cursor-spacing="20"
                :show-confirm-bar="false"
                :hold-keyboard="true"
                :maxlength="-1"
                :auto-height="true"
                placeholder="请输入消息"
                @focus="handleFocus"
                @blur="handleBlur"
                @keyboardheightchange="handleKeyboardHeightChange"
            />

            <!-- 语音录制按钮 -->
            <view
                v-show="isVoiceMode"
                class="voice-button"
                @touchstart="handleVoiceStart"
                @touchend="handleVoiceEnd"
                @touchcancel="handleVoiceCancel"
            >
                {{ isRecording ? '松开发送' : '按住说话' }}
            </view>

            <!-- 表情按钮 -->
            <view 
                class="emoji-button"
                @tap="handleEmojiButtonTap"
            >
                <text 
                    class="iconfont"
                    :class="showEmojiPanel ? 'icon-keyboard' : 'icon-emoji'"
                ></text>
            </view>

            <!-- 更多功能按钮 -->
            <view 
                class="more-button"
                @tap="handleMoreButtonTap"
            >
                <text class="iconfont icon-more"></text>
            </view>
        </view>

        <!-- 功能面板区域 -->
        <view 
            class="panel-area"
            :style="{ height: panelHeight + 'px' }"
            v-show="showPanel"
        >
            <!-- 表情面板 -->
            <emoji-panel
                v-show="showEmojiPanel"
                :input-text="inputText"
                @select="handleEmojiSelect"
                @delete="handleEmojiDelete"
                @send="handleSend"
            />

            <!-- 更多功能面板 -->
            <more-panel
                v-show="showMorePanel"
                @action="handleMoreAction"
            />
        </view>

        <!-- 语音录制提示 -->
        <view 
            class="voice-recording-mask"
            v-if="isRecording"
        >
            <view class="recording-box">
                <view class="recording-icon">
                    <text class="iconfont icon-voice"></text>
                    <view 
                        class="volume-indicator"
                        :style="{ height: voiceVolume + '%' }"
                    ></view>
                </view>
                <text class="recording-tip">
                    {{ isRecordingCanceled ? '松开手指，取消发送' : '手指上滑，取消发送' }}
                </text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import EmojiPanel from './emoji-panel.vue';
import MorePanel from './more-panel.vue';

// 组件属性定义
const props = defineProps<{
    disabled?: boolean;        // 是否禁用输入
}>();

// 事件定义
const emit = defineEmits<{
    (e: 'send-text', text: string): void;           // 发送文本消息
    (e: 'send-voice', file: File): void;            // 发送语音消息
    (e: 'panel-change', height: number): void;      // 面板高度变化
    (e: 'more-action', type: string): void;         // 更多功能面板动作
}>();

// 状态管理
const inputText = ref('');                 // 输入文本
const isVoiceMode = ref(false);           // 是否为语音模式
const isRecording = ref(false);           // 是否正在录音
const isRecordingCanceled = ref(false);   // 是否取消录音
const voiceVolume = ref(0);               // 语音音量
const showEmojiPanel = ref(false);        // 是否显示表情面板
const showMorePanel = ref(false);         // 是否显示更多功能面板
const panelHeight = ref(0);               // 面板高度

// 计算属性
const showPanel = computed(() => showEmojiPanel.value || showMorePanel.value);

// 录音相关
const recorderManager = uni.getRecorderManager();
let recordStartTime = 0;

// 初始化录音管理器
recorderManager.onStart(() => {
    console.log('录音开始');
    recordStartTime = Date.now();
});

recorderManager.onStop((res) => {
    console.log('录音结束');
    const { tempFilePath } = res;
    
    // 如果没有取消录音且录音时长大于1秒，发送语音消息
    if (!isRecordingCanceled.value && Date.now() - recordStartTime >= 1000) {
        // 将临时文件转换为 File 对象
        uni.getFileInfo({
            filePath: tempFilePath,
            success: (fileInfo) => {
                const file = new File(
                    [tempFilePath],
                    `voice_${Date.now()}.aac`,
                    { type: 'audio/aac' }
                );
                emit('send-voice', file);
            }
        });
    }
});

// 监听录音音量
recorderManager.onError((error) => {
    console.error('录音错误：', error);
    uni.showToast({
        title: '录音失败',
        icon: 'none'
    });
});

// 方法定义
// 切换语音/文字模式
const handleModeSwitch = () => {
    isVoiceMode.value = !isVoiceMode.value;
    if (isVoiceMode.value) {
        showEmojiPanel.value = false;
        showMorePanel.value = false;
    }
};

// 开始录音
const handleVoiceStart = () => {
    if (props.disabled) return;
    
    isRecording.value = true;
    isRecordingCanceled.value = false;
    voiceVolume.value = 0;

    recorderManager.start({
        duration: 60000,  // 最长录音时间，单位ms
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'aac'
    });
};

// 结束录音
const handleVoiceEnd = () => {
    if (!isRecording.value) return;
    
    isRecording.value = false;
    recorderManager.stop();
};

// 取消录音
const handleVoiceCancel = () => {
    if (!isRecording.value) return;
    
    isRecordingCanceled.value = true;
    isRecording.value = false;
    recorderManager.stop();
};

// 处理表情选择
const handleEmojiSelect = (emoji: string) => {
    inputText.value += emoji;
};

// 处理表情删除
const handleEmojiDelete = () => {
    inputText.value = inputText.value.slice(0, -1);
};

// 处理发送消息
const handleSend = () => {
    if (!inputText.value.trim()) return;
    
    emit('send-text', inputText.value);
    inputText.value = '';
};

// 处理表情按钮点击
const handleEmojiButtonTap = () => {
    showEmojiPanel.value = !showEmojiPanel.value;
    showMorePanel.value = false;
    isVoiceMode.value = false;
    updatePanelHeight();
};

// 处理更多功能按钮点击
const handleMoreButtonTap = () => {
    showMorePanel.value = !showMorePanel.value;
    showEmojiPanel.value = false;
    isVoiceMode.value = false;
    updatePanelHeight();
};

// 处理更多功能面板动作
const handleMoreAction = (type: string) => {
    emit('more-action', type);
};

// 更新面板高度
const updatePanelHeight = () => {
    const height = showPanel.value ? 460 : 0;  // 460rpx 转换为 px
    panelHeight.value = height;
    emit('panel-change', height);
};

// 处理键盘高度变化
const handleKeyboardHeightChange = (event: any) => {
    const { height } = event.detail;
    if (height === 0) {
        // 键盘收起
        showEmojiPanel.value = false;
        showMorePanel.value = false;
    }
    emit('panel-change', height);
};

// 输入框焦点事件
const handleFocus = () => {
    showEmojiPanel.value = false;
    showMorePanel.value = false;
};

const handleBlur = () => {
    // 可以在这里处理输入框失去焦点的逻辑
};
</script>

<style lang="scss">
.message-input {
    position: relative;
    background-color: #fff;
    border-top: 2rpx solid #f5f6fa;

    // 输入区域样式
    .input-area {
        display: flex;
        align-items: center;
        padding: 20rpx;
        min-height: 100rpx;

        // 模式切换按钮
        .mode-switch {
            width: 60rpx;
            height: 60rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            .iconfont {
                font-size: 48rpx;
                color: #636e72;
            }
        }

        // 文本输入框
        .text-input {
            flex: 1;
            margin: 0 20rpx;
            padding: 20rpx;
            background-color: #f5f6fa;
            border-radius: 12rpx;
            font-size: 32rpx;
            min-height: 60rpx;
            max-height: 200rpx;
        }

        // 语音录制按钮
        .voice-button {
            flex: 1;
            margin: 0 20rpx;
            height: 60rpx;
            line-height: 60rpx;
            text-align: center;
            background-color: #f5f6fa;
            border-radius: 12rpx;
            font-size: 32rpx;
            color: #636e72;

            &:active {
                background-color: #e9ecef;
            }
        }

        // 表情和更多功能按钮
        .emoji-button,
        .more-button {
            width: 60rpx;
            height: 60rpx;
            display: flex;
            align-items: center;
            justify-content: center;

            .iconfont {
                font-size: 48rpx;
                color: #636e72;
            }
        }
    }

    // 面板区域样式
    .panel-area {
        position: relative;
        transition: height 0.3s;
        overflow: hidden;
    }

    // 语音录制遮罩
    .voice-recording-mask {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;

        .recording-box {
            width: 300rpx;
            height: 300rpx;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 20rpx;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .recording-icon {
                position: relative;
                width: 120rpx;
                height: 120rpx;
                margin-bottom: 20rpx;

                .iconfont {
                    font-size: 80rpx;
                    color: #fff;
                }

                .volume-indicator {
                    position: absolute;
                    left: 50%;
                    bottom: 0;
                    transform: translateX(-50%);
                    width: 4rpx;
                    background-color: #6c5ce7;
                    transition: height 0.1s;
                }
            }

            .recording-tip {
                font-size: 28rpx;
                color: #fff;
            }
        }
    }
}
</style> 