<template>
  <view class="message-item" :class="{ 'self': isSelf }">
    <!-- 头像 -->
    <image 
      class="avatar" 
      :src="message.sender.avatar" 
      @tap="onAvatarTap"
    />

    <!-- 消息内容 -->
    <view class="content">
      <!-- 发送者名称 -->
      <text 
        v-if="!isSelf && showName" 
        class="sender-name"
      >{{ message.sender.nickname }}</text>

      <!-- 消息气泡 -->
      <view 
        class="bubble"
        :class="[
          `type-${message.type}`,
          { 'sending': message.status === 'sending' },
          { 'failed': message.status === 'failed' }
        ]"
      >
        <!-- 文本消息 -->
        <text 
          v-if="message.type === 'text'" 
          class="text-content"
          :selectable="true"
        >{{ message.content }}</text>

        <!-- 图片消息 -->
        <image 
          v-else-if="message.type === 'image'" 
          class="image-content"
          :src="localImageUrl || message.content"
          :class="{ 'loading': !localImageUrl }"
          mode="widthFix"
          @tap="previewImage"
          @load="onImageLoad"
          @error="onImageError"
        />

        <!-- 文件消息 -->
        <file-preview
          v-else-if="message.type === 'file'"
          :file-url="message.content"
          :file-name="message.fileName"
          :file-size="message.fileSize"
        />

        <!-- 语音消息 -->
        <view 
          v-else-if="message.type === 'voice'"
          class="voice-content"
          @tap="playVoice"
        >
          <text class="duration">{{ formatDuration(message.duration) }}</text>
          <view class="voice-icon" :class="{ 'playing': isPlaying }">
            <text class="iconfont icon-voice"></text>
          </view>
        </view>

        <!-- 消息状态 -->
        <view class="status" v-if="message.status">
          <text 
            v-if="message.status === 'sending'" 
            class="iconfont icon-loading loading"
          ></text>
          <text 
            v-else-if="message.status === 'failed'" 
            class="iconfont icon-warning failed"
            @tap="resendMessage"
          ></text>
        </view>
      </view>

      <!-- 消息时间 -->
      <text class="time">{{ formatTime(message.time) }}</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FilePreview from './file-preview.vue'
import { formatTime, formatDuration } from '../../utils/time'

export default defineComponent({
  name: 'MessageItem',

  components: {
    FilePreview
  },

  props: {
    message: {
      type: Object,
      required: true
    },
    showName: {
      type: Boolean,
      default: true
    },
    isSelf: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      localImageUrl: '',
      isPlaying: false,
      audioContext: null as any,
      imageLoadRetries: 0,
      maxImageLoadRetries: 3
    }
  },

  methods: {
    formatTime,
    formatDuration,

    onAvatarTap() {
      this.$emit('avatar-tap', this.message.sender)
    },

    async previewImage() {
      if (this.message.type !== 'image') return
      
      try {
        await uni.previewImage({
          urls: [this.localImageUrl || this.message.content],
          current: this.localImageUrl || this.message.content
        })
      } catch (e) {
        uni.showToast({
          title: '预览失败',
          icon: 'none'
        })
      }
    },

    async loadImage() {
      if (this.message.type !== 'image') return
      
      try {
        // 检查本地缓存
        const key = `img_${this.message.content}`
        const localInfo = uni.getStorageSync(key)
        
        if (localInfo && localInfo.path) {
          try {
            const fs = uni.getFileSystemManager()
            fs.accessSync(localInfo.path)
            this.localImageUrl = localInfo.path
            return
          } catch (e) {
            uni.removeStorageSync(key)
          }
        }

        // 下载图片
        const res = await uni.downloadFile({
          url: this.message.content
        })

        if (res.statusCode === 200) {
          const key = `img_${this.message.content}`
          uni.setStorageSync(key, {
            path: res.tempFilePath,
            time: Date.now()
          })
          this.localImageUrl = res.tempFilePath
        } else {
          throw new Error('图片加载失败')
        }
      } catch (e) {
        if (this.imageLoadRetries < this.maxImageLoadRetries) {
          this.imageLoadRetries++
          setTimeout(() => this.loadImage(), 1000)
        }
      }
    },

    onImageLoad() {
      this.imageLoadRetries = 0
    },

    onImageError() {
      if (this.imageLoadRetries < this.maxImageLoadRetries) {
        this.imageLoadRetries++
        setTimeout(() => this.loadImage(), 1000)
      }
    },

    async playVoice() {
      if (this.message.type !== 'voice' || this.isPlaying) return

      try {
        if (!this.audioContext) {
          this.audioContext = uni.createInnerAudioContext()
          this.audioContext.onEnded(() => {
            this.isPlaying = false
          })
          this.audioContext.onError(() => {
            this.isPlaying = false
            uni.showToast({
              title: '播放失败',
              icon: 'none'
            })
          })
        }

        this.audioContext.src = this.message.content
        this.audioContext.play()
        this.isPlaying = true
      } catch (e) {
        uni.showToast({
          title: '播放失败',
          icon: 'none'
        })
      }
    },

    resendMessage() {
      this.$emit('resend', this.message)
    }
  },

  watch: {
    'message.content': {
      immediate: true,
      handler(newVal) {
        if (this.message.type === 'image' && newVal) {
          this.loadImage()
        }
      }
    }
  },

  beforeUnmount() {
    if (this.audioContext) {
      this.audioContext.destroy()
    }
  }
})
</script>

<style lang="scss">
.message-item {
  display: flex;
  padding: 20rpx;
  
  &.self {
    flex-direction: row-reverse;
    
    .content {
      margin: 0 20rpx 0 100rpx;
      align-items: flex-end;
      
      .bubble {
        background: #95ec69;
        
        &::before {
          left: auto;
          right: -16rpx;
          border-color: transparent transparent transparent #95ec69;
        }
      }
    }
  }
  
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 8rpx;
    background: #eee;
  }
  
  .content {
    flex: 1;
    margin: 0 100rpx 0 20rpx;
    display: flex;
    flex-direction: column;
    
    .sender-name {
      font-size: 24rpx;
      color: #999;
      margin-bottom: 8rpx;
    }
    
    .bubble {
      position: relative;
      max-width: 60%;
      background: #fff;
      border-radius: 8rpx;
      padding: 20rpx;
      
      &::before {
        content: '';
        position: absolute;
        top: 20rpx;
        left: -16rpx;
        border: 8rpx solid;
        border-color: transparent #fff transparent transparent;
      }
      
      &.sending {
        opacity: 0.6;
      }
      
      &.failed {
        background: #fef0f0;
      }
      
      .text-content {
        font-size: 28rpx;
        color: #333;
        line-height: 1.4;
        word-break: break-all;
      }
      
      .image-content {
        max-width: 400rpx;
        border-radius: 8rpx;
        
        &.loading {
          width: 200rpx;
          height: 200rpx;
          background: #f5f5f5;
        }
      }
      
      .voice-content {
        display: flex;
        align-items: center;
        min-width: 120rpx;
        
        .duration {
          font-size: 24rpx;
          color: #999;
          margin-right: 10rpx;
        }
        
        .voice-icon {
          .iconfont {
            font-size: 40rpx;
            color: #666;
          }
          
          &.playing {
            animation: voicePlay 1s infinite;
          }
        }
      }
      
      .status {
        position: absolute;
        right: -48rpx;
        bottom: 0;
        
        .iconfont {
          font-size: 32rpx;
          
          &.loading {
            color: #999;
            animation: rotate 1s linear infinite;
          }
          
          &.failed {
            color: #ff4d4f;
          }
        }
      }
    }
    
    .time {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes voicePlay {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
