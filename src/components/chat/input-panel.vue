<template>
  <view 
    class="input-panel"
    :class="{ 'panel-expanded': isExpanded }"
    :style="{ bottom: keyboardHeight + 'px' }"
  >
    <!-- 工具栏 -->
    <view class="toolbar">
      <!-- 语音切换 -->
      <view 
        class="tool-item"
        @tap="toggleVoice"
      >
        <text 
          class="iconfont"
          :class="isVoiceMode ? 'icon-keyboard' : 'icon-voice'"
        ></text>
      </view>
      
      <!-- 输入区域 -->
      <view class="input-wrapper">
        <!-- 语音按钮 -->
        <view 
          v-if="isVoiceMode"
          class="voice-button"
          @touchstart="onVoiceStart"
          @touchend="onVoiceEnd"
          @touchcancel="onVoiceCancel"
        >
          {{ isRecording ? '松开发送' : '按住说话' }}
        </view>
        
        <!-- 文本输入 -->
        <textarea
          v-else
          ref="inputRef"
          class="input-area"
          v-model="inputText"
          :adjust-position="false"
          :show-confirm-bar="false"
          :cursor-spacing="20"
          :maxlength="maxLength"
          :placeholder="placeholder"
          :disabled="disabled"
          @focus="onFocus"
          @blur="onBlur"
          @keyboardheightchange="onKeyboardHeightChange"
          @input="onInput"
        />
        
        <!-- @提醒面板 -->
        <view 
          v-if="showAtPanel"
          class="at-panel"
        >
          <scroll-view 
            scroll-y
            class="at-list"
          >
            <view 
              v-for="user in atUsers"
              :key="user.id"
              class="at-item"
              @tap="onAtSelect(user)"
            >
              <image 
                class="user-avatar"
                :src="user.avatar"
                mode="aspectFill"
              />
              <text class="user-name">{{ user.name }}</text>
            </view>
          </scroll-view>
        </view>
      </view>
      
      <!-- 表情按钮 -->
      <view 
        class="tool-item"
        @tap="toggleEmoji"
      >
        <text 
          class="iconfont icon-emoji"
          :class="{ active: showEmoji }"
        ></text>
      </view>
      
      <!-- 更多按钮 -->
      <view 
        class="tool-item"
        @tap="toggleMore"
      >
        <text 
          class="iconfont icon-more"
          :class="{ active: showMore }"
        ></text>
      </view>
    </view>

    <!-- 扩展面板 -->
    <view class="expand-panel">
      <!-- 表情面板 -->
      <emoji-panel
        v-if="showEmoji"
        @select="onEmojiSelect"
        @delete="onEmojiDelete"
      />
      
      <!-- 更多面板 -->
      <more-panel
        v-if="showMore"
        @select="onMoreSelect"
      />
    </view>

    <!-- 录音动画 -->
    <view 
      v-if="isRecording"
      class="recording-mask"
    >
      <view class="recording-content">
        <view class="recording-wave"></view>
        <text class="recording-tip">{{ recordingTip }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import EmojiPanel from './emoji-panel.vue'
import MorePanel from './more-panel.vue'
import { parseEmoji } from '../../utils/emoji'

// 最大输入长度
const MAX_LENGTH = 500
// 最大录音时长（秒）
const MAX_RECORD_DURATION = 60
// @提醒触发字符
const AT_TRIGGER = '@'

interface AtUser {
  id: string | number
  name: string
  avatar: string
}

export default defineComponent({
  name: 'InputPanel',

  components: {
    EmojiPanel,
    MorePanel
  },

  props: {
    placeholder: {
      type: String,
      default: '请输入消息'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    maxLength: {
      type: Number,
      default: MAX_LENGTH
    }
  },

  emits: ['send', 'record', 'at'],

  setup(props, { emit }) {
    const inputRef = ref<any>(null)
    const inputText = ref('')
    const keyboardHeight = ref(0)
    const isVoiceMode = ref(false)
    const isRecording = ref(false)
    const recordingTip = ref('上滑取消')
    const showEmoji = ref(false)
    const showMore = ref(false)
    const showAtPanel = ref(false)
    const atUsers = ref<AtUser[]>([])
    const recordStartTime = ref(0)
    const recordStartY = ref(0)
    
    // 计算是否展开面板
    const isExpanded = computed(() => {
      return showEmoji.value || showMore.value
    })

    // 监听输入内容变化
    watch(inputText, (text) => {
      // 检查@触发
      const lastChar = text[text.length - 1]
      if (lastChar === AT_TRIGGER) {
        showAtPanel.value = true
        loadAtUsers()
      }
    })

    // 切换语音模式
    const toggleVoice = () => {
      isVoiceMode.value = !isVoiceMode.value
      showEmoji.value = false
      showMore.value = false
    }

    // 切换表情面板
    const toggleEmoji = () => {
      showEmoji.value = !showEmoji.value
      showMore.value = false
      if (showEmoji.value) {
        isVoiceMode.value = false
        inputRef.value?.blur()
      }
    }

    // 切换更多面板
    const toggleMore = () => {
      showMore.value = !showMore.value
      showEmoji.value = false
      if (showMore.value) {
        isVoiceMode.value = false
        inputRef.value?.blur()
      }
    }

    // 处理键盘高度变化
    const onKeyboardHeightChange = (e: any) => {
      keyboardHeight.value = e.detail.height
      if (e.detail.height > 0) {
        showEmoji.value = false
        showMore.value = false
      }
    }

    // 输入框获得焦点
    const onFocus = () => {
      showEmoji.value = false
      showMore.value = false
    }

    // 输入框失去焦点
    const onBlur = () => {
      // 延迟处理，避免与面板切换冲突
      setTimeout(() => {
        if (!showEmoji.value && !showMore.value) {
          keyboardHeight.value = 0
        }
      }, 100)
    }

    // 处理输入
    const onInput = () => {
      // 特殊字符处理
      inputText.value = parseEmoji(inputText.value)
    }

    // 选择表情
    const onEmojiSelect = (emoji: string) => {
      inputText.value += emoji
    }

    // 删除表情
    const onEmojiDelete = () => {
      if (inputText.value) {
        // 删除最后一个字符或表情
        const match = inputText.value.match(/\[[^\]]+\]$/)
        if (match) {
          inputText.value = inputText.value.slice(0, -match[0].length)
        } else {
          inputText.value = inputText.value.slice(0, -1)
        }
      }
    }

    // 选择更多面板项
    const onMoreSelect = (type: string) => {
      emit('send', { type, content: null })
      showMore.value = false
    }

    // 开始录音
    const onVoiceStart = (e: any) => {
      recordStartTime.value = Date.now()
      recordStartY.value = e.touches[0].clientY
      isRecording.value = true
      
      uni.startRecord({
        success: () => {
          // 设置最大录音时长
          setTimeout(() => {
            if (isRecording.value) {
              onVoiceEnd()
            }
          }, MAX_RECORD_DURATION * 1000)
        },
        fail: () => {
          isRecording.value = false
          uni.showToast({
            title: '录音失败',
            icon: 'none'
          })
        }
      })
    }

    // 结束录音
    const onVoiceEnd = () => {
      if (!isRecording.value) return
      
      const duration = (Date.now() - recordStartTime.value) / 1000
      isRecording.value = false
      
      if (duration < 1) {
        uni.showToast({
          title: '说话时间太短',
          icon: 'none'
        })
        return
      }
      
      uni.stopRecord({
        success: (res) => {
          emit('record', {
            path: res.tempFilePath,
            duration
          })
        }
      })
    }

    // 取消录音
    const onVoiceCancel = (e: any) => {
      if (!isRecording.value) return
      
      const moveY = recordStartY.value - e.changedTouches[0].clientY
      if (moveY > 100) {
        isRecording.value = false
        uni.stopRecord()
        uni.showToast({
          title: '已取消',
          icon: 'none'
        })
      }
    }

    // 加载@用户列表
    const loadAtUsers = async () => {
      try {
        // 这里应该调用实际的API
        atUsers.value = [
          { id: 1, name: '用户1', avatar: '/static/avatar1.png' },
          { id: 2, name: '用户2', avatar: '/static/avatar2.png' }
        ]
      } catch (e) {
        console.error('加载@用户列表失败:', e)
      }
    }

    // 选择@用户
    const onAtSelect = (user: AtUser) => {
      // 替换@触发符为完整的@用户
      inputText.value = inputText.value.replace(
        new RegExp(`${AT_TRIGGER}$`),
        `${AT_TRIGGER}${user.name} `
      )
      showAtPanel.value = false
      emit('at', user)
    }

    return {
      inputRef,
      inputText,
      keyboardHeight,
      isVoiceMode,
      isRecording,
      recordingTip,
      showEmoji,
      showMore,
      showAtPanel,
      atUsers,
      isExpanded,
      toggleVoice,
      toggleEmoji,
      toggleMore,
      onKeyboardHeightChange,
      onFocus,
      onBlur,
      onInput,
      onEmojiSelect,
      onEmojiDelete,
      onMoreSelect,
      onVoiceStart,
      onVoiceEnd,
      onVoiceCancel,
      onAtSelect
    }
  }
})
</script>

<style lang="scss">
.input-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  transition: bottom 0.3s;
  
  .toolbar {
    display: flex;
    align-items: center;
    padding: 20rpx;
    border-top: 1rpx solid #eee;
    
    .tool-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80rpx;
      height: 80rpx;
      
      .iconfont {
        font-size: 44rpx;
        color: #666;
        
        &.active {
          color: #07c160;
        }
      }
      
      &:active {
        opacity: 0.7;
      }
    }
    
    .input-wrapper {
      flex: 1;
      position: relative;
      margin: 0 20rpx;
      
      .voice-button {
        width: 100%;
        height: 80rpx;
        line-height: 80rpx;
        text-align: center;
        font-size: 28rpx;
        color: #333;
        background: #f5f5f5;
        border-radius: 8rpx;
        
        &:active {
          background: #e0e0e0;
        }
      }
      
      .input-area {
        width: 100%;
        min-height: 80rpx;
        max-height: 200rpx;
        padding: 20rpx;
        font-size: 28rpx;
        line-height: 40rpx;
        background: #f5f5f5;
        border-radius: 8rpx;
      }
      
      .at-panel {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 100%;
        max-height: 400rpx;
        background: #fff;
        box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
        
        .at-list {
          max-height: 400rpx;
          
          .at-item {
            display: flex;
            align-items: center;
            padding: 20rpx;
            
            .user-avatar {
              width: 60rpx;
              height: 60rpx;
              border-radius: 50%;
              margin-right: 20rpx;
            }
            
            .user-name {
              font-size: 28rpx;
              color: #333;
            }
            
            &:active {
              background: #f5f5f5;
            }
          }
        }
      }
    }
  }
  
  .expand-panel {
    height: 500rpx;
    overflow: hidden;
    transition: height 0.3s;
    
    &:empty {
      height: 0;
    }
  }
  
  .recording-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .recording-content {
      width: 300rpx;
      height: 300rpx;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 20rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      .recording-wave {
        width: 120rpx;
        height: 120rpx;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        position: relative;
        
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80rpx;
          height: 80rpx;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: wave 1.5s ease-out infinite;
        }
        
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40rpx;
          height: 40rpx;
          background: #fff;
          border-radius: 50%;
        }
      }
      
      .recording-tip {
        margin-top: 40rpx;
        font-size: 28rpx;
        color: #fff;
      }
    }
  }
}

@keyframes wave {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}
</style> 