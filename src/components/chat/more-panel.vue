<template>
  <view class="more-panel">
    <view class="panel-grid">
      <!-- 图片选择 -->
      <view class="grid-item" @tap="handleImage">
        <view class="icon-wrapper">
          <text class="iconfont icon-image"></text>
        </view>
        <text class="label">图片</text>
      </view>

      <!-- 拍摄 -->
      <view class="grid-item" @tap="handleCamera">
        <view class="icon-wrapper">
          <text class="iconfont icon-camera"></text>
        </view>
        <text class="label">拍摄</text>
      </view>

      <!-- 文件 -->
      <view class="grid-item" @tap="handleFile">
        <view class="icon-wrapper">
          <text class="iconfont icon-file"></text>
        </view>
        <text class="label">文件</text>
      </view>

      <!-- 语音通话 -->
      <view class="grid-item" @tap="handleVoiceCall">
        <view class="icon-wrapper">
          <text class="iconfont icon-voice-call"></text>
        </view>
        <text class="label">语音通话</text>
      </view>
    </view>

    <!-- 文件类型选择弹窗 -->
    <uni-popup ref="fileTypePopup" type="bottom">
      <view class="file-type-popup">
        <view class="popup-header">
          <text class="title">选择文件类型</text>
          <text class="close" @tap="closeFileTypePopup">关闭</text>
        </view>
        <view class="file-types">
          <view 
            class="type-item"
            v-for="type in fileTypes"
            :key="type.value"
            @tap="selectFileType(type)"
          >
            <text class="iconfont" :class="type.icon"></text>
            <text class="type-name">{{ type.label }}</text>
            <text class="type-desc">{{ type.description }}</text>
          </view>
        </view>
        <view class="size-limit">
          <text>支持 {{ formatSize(maxFileSize) }} 以内的文件</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

// 基于 Flamingo 支持的文件类型
const FILE_TYPES = [
  {
    label: '文档',
    value: 'document',
    icon: 'icon-document',
    description: 'Word、Excel、PDF等',
    extensions: ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'txt']
  },
  {
    label: '媒体',
    value: 'media',
    icon: 'icon-media',
    description: '音频、视频文件',
    extensions: ['mp3', 'wav', 'mp4', 'mov']
  },
  {
    label: '压缩包',
    value: 'archive',
    icon: 'icon-archive',
    description: 'ZIP、RAR等压缩文件',
    extensions: ['zip', 'rar', '7z']
  },
  {
    label: '其他',
    value: 'other',
    icon: 'icon-other',
    description: '其他类型文件',
    extensions: []
  }
]

export default defineComponent({
  name: 'MorePanel',

  data() {
    return {
      fileTypes: FILE_TYPES,
      maxFileSize: 100 * 1024 * 1024, // 100MB，基于 Flamingo 的限制
      maxImageSize: 10 * 1024 * 1024  // 10MB，基于 Flamingo 的限制
    }
  },

  methods: {
    formatSize(size: number): string {
      if (size < 1024) return `${size}B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
      return `${(size / 1024 / 1024).toFixed(1)}MB`
    },

    async handleImage() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['album']
        })

        const tempFile = res.tempFiles[0]
        if (tempFile.size > this.maxImageSize) {
          throw new Error(`图片大小不能超过${this.formatSize(this.maxImageSize)}`)
        }

        this.$emit('select', {
          type: 'image',
          tempFilePath: res.tempFilePaths[0],
          size: tempFile.size
        })
      } catch (e) {
        if (e.errMsg !== 'chooseImage:fail cancel') {
          uni.showToast({
            title: e.message || '选择图片失败',
            icon: 'none'
          })
        }
      }
    },

    async handleCamera() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['camera']
        })

        const tempFile = res.tempFiles[0]
        if (tempFile.size > this.maxImageSize) {
          throw new Error(`图片大小不能超过${this.formatSize(this.maxImageSize)}`)
        }

        this.$emit('select', {
          type: 'image',
          tempFilePath: res.tempFilePaths[0],
          size: tempFile.size
        })
      } catch (e) {
        if (e.errMsg !== 'chooseImage:fail cancel') {
          uni.showToast({
            title: e.message || '拍摄失败',
            icon: 'none'
          })
        }
      }
    },

    handleFile() {
      // @ts-ignore
      this.$refs.fileTypePopup.open()
    },

    closeFileTypePopup() {
      // @ts-ignore
      this.$refs.fileTypePopup.close()
    },

    async selectFileType(type: typeof FILE_TYPES[0]) {
      this.closeFileTypePopup()

      try {
        const res = await uni.chooseFile({
          count: 1,
          type: 'all',
          extension: type.extensions
        })

        const tempFile = res.tempFiles[0]
        if (tempFile.size > this.maxFileSize) {
          throw new Error(`文件大小不能超过${this.formatSize(this.maxFileSize)}`)
        }

        this.$emit('select', {
          type: 'file',
          tempFilePath: tempFile.path,
          name: tempFile.name,
          size: tempFile.size
        })
      } catch (e) {
        if (e.errMsg !== 'chooseFile:fail cancel') {
          uni.showToast({
            title: e.message || '选择文件失败',
            icon: 'none'
          })
        }
      }
    },

    async handleVoiceCall() {
      // 基于 Flamingo 的语音通话功能
      this.$emit('select', {
        type: 'voice-call'
      })
    }
  }
})
</script>

<style lang="scss">
.more-panel {
  background: #fff;
  padding: 30rpx 20rpx;
  
  .panel-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    
    .grid-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .icon-wrapper {
        width: 100rpx;
        height: 100rpx;
        background: #f5f5f5;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12rpx;
        
        .iconfont {
          font-size: 48rpx;
          color: #666;
        }
      }
      
      .label {
        font-size: 24rpx;
        color: #333;
      }
      
      &:active {
        opacity: 0.7;
      }
    }
  }
}

.file-type-popup {
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
    
    .close {
      font-size: 28rpx;
      color: #999;
    }
  }
  
  .file-types {
    .type-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .iconfont {
        font-size: 40rpx;
        color: #666;
        margin-right: 20rpx;
      }
      
      .type-name {
        font-size: 28rpx;
        color: #333;
        margin-right: 20rpx;
      }
      
      .type-desc {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
  
  .size-limit {
    margin-top: 20rpx;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
}
</style>
