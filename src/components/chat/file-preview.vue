<template>
  <view class="file-preview">
    <!-- 文件基本信息 -->
    <view class="file-info">
      <view class="file-icon">
        <text class="iconfont" :class="fileIconClass"></text>
      </view>
      <view class="file-detail">
        <text class="filename">{{ fileName }}</text>
        <text class="filesize">{{ formatSize(fileSize) }}</text>
      </view>
    </view>

    <!-- 下载进度 -->
    <view class="download-progress" v-if="downloading">
      <view class="progress-bar">
        <view 
          class="progress-inner"
          :style="{ width: `${downloadProgress}%` }"
        ></view>
      </view>
      <text class="progress-text">{{ downloadProgress }}%</text>
      <view class="cancel-download" @tap="cancelDownload">取消</view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button 
        class="action-btn preview"
        v-if="canPreview && !downloading"
        @tap="handlePreview"
      >
        预览
      </button>
      <button 
        class="action-btn download"
        v-if="!downloading && !isDownloaded"
        @tap="handleDownload"
      >
        下载
      </button>
      <button 
        class="action-btn open"
        v-if="isDownloaded"
        @tap="handleOpen"
      >
        打开
      </button>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

// 基于 Flamingo 支持的文件类型
const PREVIEW_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif'],
  video: ['mp4', 'mov'],
  audio: ['mp3', 'wav'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
}

const CHUNK_SIZE = 1024 * 1024 // 1MB 分片大小

export default defineComponent({
  name: 'FilePreview',

  props: {
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      downloading: false,
      downloadProgress: 0,
      isDownloaded: false,
      localPath: '',
      downloadTask: null as any
    }
  },

  computed: {
    fileType(): string {
      const extension = this.fileName.split('.').pop()?.toLowerCase() || ''
      if (PREVIEW_TYPES.image.includes(extension)) return 'image'
      if (PREVIEW_TYPES.video.includes(extension)) return 'video'
      if (PREVIEW_TYPES.audio.includes(extension)) return 'audio'
      if (PREVIEW_TYPES.document.includes(extension)) return 'document'
      return 'other'
    },

    fileIconClass(): string {
      const iconMap = {
        image: 'icon-image',
        video: 'icon-video',
        audio: 'icon-audio',
        document: 'icon-document',
        other: 'icon-file'
      }
      return iconMap[this.fileType]
    },

    canPreview(): boolean {
      return ['image', 'video', 'audio'].includes(this.fileType)
    }
  },

  methods: {
    formatSize(size: number): string {
      if (size < 1024) return `${size}B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
      if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`
      return `${(size / 1024 / 1024 / 1024).toFixed(1)}GB`
    },

    async checkLocalFile(): Promise<boolean> {
      try {
        const key = `file_${this.fileUrl}`
        const localInfo = uni.getStorageSync(key)
        if (localInfo) {
          const fs = uni.getFileSystemManager()
          try {
            fs.accessSync(localInfo.path)
            this.localPath = localInfo.path
            this.isDownloaded = true
            return true
          } catch (e) {
            uni.removeStorageSync(key)
          }
        }
        return false
      } catch (e) {
        return false
      }
    },

    async handleDownload() {
      if (this.downloading) return
      
      try {
        this.downloading = true
        this.downloadProgress = 0
        
        // 使用 Flamingo 的文件下载接口
        this.downloadTask = uni.downloadFile({
          url: this.fileUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              const key = `file_${this.fileUrl}`
              uni.setStorageSync(key, {
                path: res.tempFilePath,
                time: Date.now()
              })
              this.localPath = res.tempFilePath
              this.isDownloaded = true
              uni.showToast({
                title: '下载成功',
                icon: 'success'
              })
            } else {
              throw new Error('下载失败')
            }
          },
          fail: (err) => {
            throw new Error(err.errMsg || '下载失败')
          },
          complete: () => {
            this.downloading = false
            this.downloadTask = null
          }
        })

        this.downloadTask.onProgressUpdate((res) => {
          this.downloadProgress = res.progress
        })
      } catch (e) {
        uni.showToast({
          title: e.message || '下载失败',
          icon: 'none'
        })
        this.downloading = false
        this.downloadTask = null
      }
    },

    cancelDownload() {
      if (this.downloadTask) {
        this.downloadTask.abort()
        this.downloadTask = null
      }
      this.downloading = false
      this.downloadProgress = 0
    },

    async handlePreview() {
      if (!this.canPreview) return
      
      try {
        const filePath = this.isDownloaded ? this.localPath : this.fileUrl
        
        switch (this.fileType) {
          case 'image':
            uni.previewImage({
              urls: [filePath]
            })
            break
            
          case 'video':
            uni.navigateTo({
              url: `/pages/common/video-player?url=${encodeURIComponent(filePath)}`
            })
            break
            
          case 'audio':
            // 使用 Flamingo 的音频播放接口
            const innerAudioContext = uni.createInnerAudioContext()
            innerAudioContext.src = filePath
            innerAudioContext.play()
            break
        }
      } catch (e) {
        uni.showToast({
          title: '预览失败',
          icon: 'none'
        })
      }
    },

    async handleOpen() {
      if (!this.isDownloaded) return
      
      try {
        // 使用系统应用打开文件
        await uni.openDocument({
          filePath: this.localPath,
          showMenu: true
        })
      } catch (e) {
        uni.showToast({
          title: '打开失败',
          icon: 'none'
        })
      }
    }
  },

  async mounted() {
    await this.checkLocalFile()
  }
})
</script>

<style lang="scss">
.file-preview {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  
  .file-info {
    display: flex;
    align-items: center;
    
    .file-icon {
      width: 80rpx;
      height: 80rpx;
      background: #f5f5f5;
      border-radius: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .iconfont {
        font-size: 40rpx;
        color: #666;
      }
    }
    
    .file-detail {
      flex: 1;
      margin-left: 20rpx;
      
      .filename {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        @include text-ellipsis;
      }
      
      .filesize {
        font-size: 24rpx;
        color: #999;
        margin-top: 8rpx;
      }
    }
  }
  
  .download-progress {
    margin-top: 20rpx;
    
    .progress-bar {
      height: 4rpx;
      background: #f5f5f5;
      border-radius: 2rpx;
      overflow: hidden;
      
      .progress-inner {
        height: 100%;
        background: #07c160;
        transition: width 0.2s;
      }
    }
    
    .progress-text {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
    }
    
    .cancel-download {
      font-size: 24rpx;
      color: #576b95;
      text-align: center;
      margin-top: 16rpx;
    }
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20rpx;
    
    .action-btn {
      margin-left: 20rpx;
      height: 56rpx;
      line-height: 56rpx;
      padding: 0 32rpx;
      font-size: 24rpx;
      border-radius: 28rpx;
      
      &.preview {
        background: #f5f5f5;
        color: #333;
      }
      
      &.download {
        background: #07c160;
        color: #fff;
      }
      
      &.open {
        background: #576b95;
        color: #fff;
      }
    }
  }
}
</style>
