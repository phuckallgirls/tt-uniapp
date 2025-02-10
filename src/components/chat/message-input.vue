<template>
  <view class="message-input">
    <!-- 输入区域 -->
    <view class="input-area">
      <textarea
        v-model="messageText"
        class="input"
        :adjust-position="false"
        :show-confirm-bar="false"
        :cursor-spacing="20"
        :maxlength="-1"
        :auto-height="true"
        placeholder="请输入消息"
        @focus="onInputFocus"
        @blur="onInputBlur"
      />
      <view class="action-buttons">
        <view class="emoji-btn" @tap="toggleEmojiPanel">
          <text class="iconfont icon-emoji"></text>
        </view>
        <view class="more-btn" @tap="toggleMorePanel">
          <text class="iconfont icon-more"></text>
        </view>
        <button 
          class="send-btn" 
          :class="{ active: messageText.trim() }"
          @tap="sendTextMessage"
        >发送</button>
      </view>
    </view>

    <!-- 表情面板 -->
    <emoji-panel
      v-if="showEmojiPanel"
      @select="onEmojiSelect"
      @close="closeEmojiPanel"
    />

    <!-- 更多面板 -->
    <more-panel
      v-if="showMorePanel"
      @select="onMoreSelect"
      @close="closeMorePanel"
    />

    <!-- 文件上传进度 -->
    <view class="upload-progress" v-if="currentUpload">
      <view class="progress-info">
        <text class="filename">{{ currentUpload.fileName }}</text>
        <text class="progress-text">{{ currentUpload.progress }}%</text>
      </view>
      <view class="progress-bar">
        <view 
          class="progress-inner"
          :style="{ width: currentUpload.progress + '%' }"
        ></view>
      </view>
      <view 
        class="cancel-upload"
        @tap="cancelCurrentUpload"
      >取消</view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { uploadManager } from '../../utils/upload'
import type { UploadTask } from '../../types/upload'
import EmojiPanel from './emoji-panel.vue'
import MorePanel from './more-panel.vue'

export default defineComponent({
  name: 'MessageInput',
  
  components: {
    EmojiPanel,
    MorePanel
  },

  props: {
    sessionId: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      messageText: '',
      showEmojiPanel: false,
      showMorePanel: false,
      currentUpload: null as UploadTask | null,
      isInputFocused: false
    }
  },

  methods: {
    onInputFocus() {
      this.isInputFocused = true
      this.showEmojiPanel = false
      this.showMorePanel = false
    },

    onInputBlur() {
      this.isInputFocused = false
    },

    toggleEmojiPanel() {
      this.showEmojiPanel = !this.showEmojiPanel
      this.showMorePanel = false
    },

    toggleMorePanel() {
      this.showMorePanel = !this.showMorePanel
      this.showEmojiPanel = false
    },

    closeEmojiPanel() {
      this.showEmojiPanel = false
    },

    closeMorePanel() {
      this.showMorePanel = false
    },

    onEmojiSelect(emoji: string) {
      this.messageText += emoji
    },

    async onMoreSelect(type: string) {
      switch (type) {
        case 'image':
          await this.handleImageUpload()
          break
        case 'file':
          await this.handleFileUpload()
          break
      }
      this.showMorePanel = false
    },

    async handleImageUpload() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })

        const tempFilePath = res.tempFilePaths[0]
        const fileName = tempFilePath.split('/').pop() || '图片'

        this.currentUpload = {
          taskId: Date.now().toString(),
          fileName,
          progress: 0,
          status: 'uploading'
        }

        const result = await uploadManager.uploadImage(tempFilePath, {
          compress: true,
          quality: 80,
          onProgress: (progress) => {
            if (this.currentUpload) {
              this.currentUpload.progress = progress
            }
          }
        })

        this.currentUpload.status = 'success'
        this.currentUpload.result = result

        // 发送图片消息
        this.$emit('send', {
          type: 'image',
          content: result.url,
          fileName: result.name,
          fileSize: result.size
        })
      } catch (e) {
        if (this.currentUpload) {
          this.currentUpload.status = 'fail'
          this.currentUpload.error = e.message
        }
        uni.showToast({
          title: e.message || '图片发送失败',
          icon: 'none'
        })
      } finally {
        setTimeout(() => {
          this.currentUpload = null
        }, 1500)
      }
    },

    async handleFileUpload() {
      try {
        const res = await uni.chooseFile({
          count: 1,
          type: 'all'
        })

        const tempFilePath = res.tempFiles[0].path
        const fileName = res.tempFiles[0].name || tempFilePath.split('/').pop() || '文件'

        this.currentUpload = {
          taskId: Date.now().toString(),
          fileName,
          progress: 0,
          status: 'uploading'
        }

        const result = await uploadManager.uploadFile(tempFilePath, (progress) => {
          if (this.currentUpload) {
            this.currentUpload.progress = progress
          }
        })

        this.currentUpload.status = 'success'
        this.currentUpload.result = result

        // 发送文件消息
        this.$emit('send', {
          type: 'file',
          content: result.url,
          fileName: result.name,
          fileSize: result.size
        })
      } catch (e) {
        if (this.currentUpload) {
          this.currentUpload.status = 'fail'
          this.currentUpload.error = e.message
        }
        uni.showToast({
          title: e.message || '文件发送失败',
          icon: 'none'
        })
      } finally {
        setTimeout(() => {
          this.currentUpload = null
        }, 1500)
      }
    },

    sendTextMessage() {
      const text = this.messageText.trim()
      if (!text) return

      this.$emit('send', {
        type: 'text',
        content: text
      })
      this.messageText = ''
    },

    cancelCurrentUpload() {
      if (this.currentUpload) {
        uploadManager.cancelUpload(this.currentUpload.taskId)
        this.currentUpload = null
      }
    }
  }
})
</script>

<style lang="scss">
.message-input {
  position: relative;
  background: #fff;
  border-top: 1rpx solid #eee;
  
  .input-area {
    display: flex;
    align-items: flex-end;
    padding: 20rpx;
    
    .input {
      flex: 1;
      min-height: 72rpx;
      max-height: 200rpx;
      background: #f5f5f5;
      border-radius: 8rpx;
      padding: 16rpx;
      font-size: 28rpx;
      line-height: 40rpx;
    }
    
    .action-buttons {
      display: flex;
      align-items: center;
      margin-left: 20rpx;
      
      .emoji-btn,
      .more-btn {
        padding: 0 16rpx;
        
        .iconfont {
          font-size: 48rpx;
          color: #666;
        }
      }
      
      .send-btn {
        margin-left: 16rpx;
        height: 72rpx;
        line-height: 72rpx;
        padding: 0 32rpx;
        font-size: 28rpx;
        color: #999;
        background: #f5f5f5;
        border: none;
        border-radius: 8rpx;
        
        &.active {
          background: #07c160;
          color: #fff;
        }
      }
    }
  }
  
  .upload-progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
    background: rgba(0, 0, 0, 0.7);
    padding: 20rpx;
    
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10rpx;
      
      .filename {
        color: #fff;
        font-size: 24rpx;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .progress-text {
        color: #fff;
        font-size: 24rpx;
        margin-left: 20rpx;
      }
    }
    
    .progress-bar {
      height: 4rpx;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2rpx;
      overflow: hidden;
      
      .progress-inner {
        height: 100%;
        background: #07c160;
        transition: width 0.2s;
      }
    }
    
    .cancel-upload {
      color: #fff;
      font-size: 24rpx;
      text-align: center;
      margin-top: 10rpx;
      padding: 10rpx;
    }
  }
}
</style>
</rewritten_file>
