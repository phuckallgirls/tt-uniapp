<template>
  <view class="emoji-panel">
    <!-- 最近使用 -->
    <scroll-view 
      v-if="showRecent && recentEmojis.length > 0"
      class="recent-emojis"
      scroll-x
    >
      <view 
        class="recent-item"
        v-for="(emoji, index) in recentEmojis"
        :key="index"
        @tap="onEmojiSelect(emoji)"
      >
        <text class="emoji-text">{{ emojiMap[emoji] }}</text>
      </view>
    </scroll-view>

    <!-- 表情内容区 -->
    <swiper 
      class="emoji-content"
      :current="currentPage"
      @change="onPageChange"
    >
      <swiper-item 
        v-for="(group, groupIndex) in emojiGroups"
        :key="groupIndex"
      >
        <scroll-view 
          class="emoji-grid"
          scroll-y
        >
          <view 
            class="emoji-item"
            v-for="(emoji, index) in group.items"
            :key="index"
            @tap="onEmojiSelect(emoji)"
          >
            <text class="emoji-text">{{ emojiMap[emoji] }}</text>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>

    <!-- 分组标签 -->
    <view class="emoji-tabs">
      <view 
        v-for="(group, index) in emojiGroups"
        :key="index"
        class="tab-item"
        :class="{ active: currentPage === index }"
        @tap="switchPage(index)"
      >
        <text class="tab-text">{{ group.name }}</text>
      </view>
      <view 
        class="tab-item delete"
        @tap="onDelete"
      >
        <text class="iconfont icon-delete"></text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { emojiMap, emojiGroups } from '../../utils/emoji'

const MAX_RECENT_COUNT = 20
const STORAGE_KEY = 'tt_recent_emojis'

export default defineComponent({
  name: 'EmojiPanel',

  props: {
    showRecent: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      emojiGroups,
      emojiMap,
      currentPage: 0,
      recentEmojis: [] as string[]
    }
  },

  created() {
    this.loadRecentEmojis()
  },

  methods: {
    onPageChange(e: any) {
      this.currentPage = e.detail.current
    },

    switchPage(index: number) {
      this.currentPage = index
    },

    onEmojiSelect(emoji: string) {
      this.$emit('select', emoji)
      this.addToRecent(emoji)
      // 触感反馈
      uni.vibrateShort({ type: 'light' })
    },

    onDelete() {
      this.$emit('delete')
      // 触感反馈
      uni.vibrateShort({ type: 'medium' })
    },

    loadRecentEmojis() {
      try {
        const recent = uni.getStorageSync(STORAGE_KEY)
        if (recent) {
          this.recentEmojis = JSON.parse(recent)
        }
      } catch (e) {
        console.error('加载最近使用表情失败:', e)
        this.recentEmojis = []
      }
    },

    addToRecent(emoji: string) {
      const index = this.recentEmojis.indexOf(emoji)
      if (index > -1) {
        this.recentEmojis.splice(index, 1)
      }
      this.recentEmojis.unshift(emoji)
      
      if (this.recentEmojis.length > MAX_RECENT_COUNT) {
        this.recentEmojis = this.recentEmojis.slice(0, MAX_RECENT_COUNT)
      }
      
      try {
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(this.recentEmojis))
      } catch (e) {
        console.error('保存最近使用表情失败:', e)
      }
    }
  }
})
</script>

<style lang="scss">
.emoji-panel {
  background: #fff;
  height: 500rpx;
  display: flex;
  flex-direction: column;
  
  .recent-emojis {
    height: 100rpx;
    white-space: nowrap;
    padding: 10rpx 20rpx;
    border-bottom: 1rpx solid #eee;
    
    .recent-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80rpx;
      height: 80rpx;
      
      .emoji-text {
        font-size: 40rpx;
      }
      
      &:active {
        background: #f5f5f5;
        border-radius: 8rpx;
      }
    }
  }
  
  .emoji-content {
    flex: 1;
    
    .emoji-grid {
      height: 100%;
      padding: 20rpx;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-gap: 10rpx;
      
      .emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80rpx;
        
        .emoji-text {
          font-size: 40rpx;
          line-height: 1;
        }
        
        &:active {
          background: #f5f5f5;
          border-radius: 8rpx;
        }
      }
    }
  }
  
  .emoji-tabs {
    height: 100rpx;
    display: flex;
    align-items: center;
    padding: 0 20rpx;
    border-top: 1rpx solid #eee;
    
    .tab-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      position: relative;
      
      .tab-text {
        font-size: 28rpx;
        color: #666;
        transition: color 0.2s;
      }
      
      .iconfont {
        font-size: 40rpx;
        color: #666;
      }
      
      &.active {
        .tab-text {
          color: #07c160;
          font-weight: 500;
        }
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background: #07c160;
          border-radius: 2rpx;
        }
      }
      
      &.delete {
        flex: none;
        width: 100rpx;
      }
      
      &:active {
        opacity: 0.7;
      }
    }
  }
}
</style>
