<template>
  <view 
    class="virtual-list"
    :style="{ height: height }"
    @scroll="onScroll"
  >
    <view 
      class="list-phantom"
      :style="{ height: totalHeight + 'px' }"
    ></view>
    
    <view 
      class="list-content"
      :style="{ transform: `translate3d(0, ${offsetTop}px, 0)` }"
    >
      <view
        v-for="item in visibleData"
        :key="item.id"
        :id="`item-${item.id}`"
        class="list-item"
        :style="{ height: item.height + 'px' }"
      >
        <slot :item="item"></slot>
      </view>
    </view>

    <!-- 下拉刷新提示 -->
    <view 
      class="refresh-tip"
      :class="{ 'refreshing': isRefreshing }"
      :style="{ transform: `translate3d(0, ${refreshDistance}px, 0)` }"
    >
      <view class="refresh-content">
        <view class="loading-icon"></view>
        <text>{{ refreshText }}</text>
      </view>
    </view>

    <!-- 滚动到底部按钮 -->
    <view 
      v-if="showScrollBottom"
      class="scroll-bottom"
      @tap="scrollToBottom"
    >
      <text class="iconfont icon-arrow-down"></text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const ITEM_DEFAULT_HEIGHT = 100 // 默认项高度
const BUFFER_SIZE = 5 // 缓冲区大小
const REFRESH_THRESHOLD = 100 // 下拉刷新阈值

interface ItemData {
  id: string | number
  height?: number
  [key: string]: any
}

export default defineComponent({
  name: 'VirtualList',

  props: {
    height: {
      type: String,
      default: '100vh'
    },
    items: {
      type: Array as () => ItemData[],
      required: true
    },
    itemHeight: {
      type: Number,
      default: ITEM_DEFAULT_HEIGHT
    },
    bufferSize: {
      type: Number,
      default: BUFFER_SIZE
    }
  },

  data() {
    return {
      scrollTop: 0,
      offsetTop: 0,
      visibleData: [] as ItemData[],
      itemPositions: [] as { top: number; bottom: number; height: number }[],
      startIndex: 0,
      endIndex: 0,
      refreshDistance: 0,
      isRefreshing: false,
      showScrollBottom: false,
      lastScrollTop: 0,
      scrollTimer: null as any,
      resizeObserver: null as any
    }
  },

  computed: {
    totalHeight(): number {
      return this.itemPositions[this.itemPositions.length - 1]?.bottom || 0
    },

    refreshText(): string {
      if (this.isRefreshing) return '正在刷新...'
      return this.refreshDistance >= REFRESH_THRESHOLD ? '释放刷新' : '下拉刷新'
    }
  },

  watch: {
    items: {
      handler() {
        this.initPositions()
        this.updateVisibleData()
      },
      deep: true
    }
  },

  mounted() {
    this.initPositions()
    this.updateVisibleData()
    this.initResizeObserver()
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  },

  methods: {
    initPositions() {
      let top = 0
      this.itemPositions = this.items.map(item => {
        const height = item.height || this.itemHeight
        const position = {
          top,
          bottom: top + height,
          height
        }
        top += height
        return position
      })
    },

    updateVisibleData() {
      const scrollTop = this.scrollTop
      const visibleHeight = parseFloat(this.height)
      
      // 二分查找可视区域的起始索引
      let start = this.binarySearch(scrollTop)
      let end = this.binarySearch(scrollTop + visibleHeight)
      
      // 添加缓冲区
      start = Math.max(0, start - this.bufferSize)
      end = Math.min(this.items.length - 1, end + this.bufferSize)
      
      this.startIndex = start
      this.endIndex = end
      this.visibleData = this.items.slice(start, end + 1)
      this.offsetTop = start > 0 ? this.itemPositions[start].top : 0
    },

    binarySearch(offset: number): number {
      let start = 0
      let end = this.itemPositions.length - 1
      let temp = null
      
      while (start <= end) {
        const mid = Math.floor((start + end) / 2)
        const midValue = this.itemPositions[mid]
        
        if (midValue.bottom === offset) {
          return mid + 1
        } else if (midValue.bottom < offset) {
          start = mid + 1
        } else if (midValue.top > offset) {
          end = mid - 1
        } else {
          temp = mid
          break
        }
      }
      
      return temp !== null ? temp : start
    },

    onScroll(e: any) {
      const scrollTop = e.detail.scrollTop
      this.scrollTop = scrollTop
      
      // 更新可视区域数据
      this.updateVisibleData()
      
      // 处理下拉刷新
      if (scrollTop < 0) {
        this.refreshDistance = Math.abs(scrollTop)
        if (!this.isRefreshing && this.refreshDistance >= REFRESH_THRESHOLD) {
          this.handleRefresh()
        }
      } else {
        this.refreshDistance = 0
      }
      
      // 处理滚动到底部按钮
      const direction = scrollTop > this.lastScrollTop ? 'down' : 'up'
      this.lastScrollTop = scrollTop
      
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer)
      }
      
      this.scrollTimer = setTimeout(() => {
        const isNearBottom = this.totalHeight - scrollTop - parseFloat(this.height) < 500
        this.showScrollBottom = !isNearBottom && direction === 'up'
      }, 200)
    },

    async handleRefresh() {
      if (this.isRefreshing) return
      
      this.isRefreshing = true
      this.$emit('refresh')
      
      // 等待刷新完成
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      this.isRefreshing = false
      this.refreshDistance = 0
    },

    scrollToBottom() {
      const scrollView = uni.createSelectorQuery().in(this).select('.virtual-list')
      scrollView.node(res => {
        res?.node?.scrollTo({
          top: this.totalHeight,
          behavior: 'smooth'
        })
      }).exec()
    },

    initResizeObserver() {
      // 监听列表项大小变化
      this.resizeObserver = uni.createIntersectionObserver(this)
      this.resizeObserver
        .relativeToViewport()
        .observe('.list-item', (res: any) => {
          if (res.intersectionRatio > 0) {
            const id = res.id.replace('item-', '')
            const index = this.items.findIndex(item => item.id === id)
            if (index > -1) {
              const height = res.boundingClientRect.height
              if (height !== this.items[index].height) {
                this.items[index].height = height
                this.initPositions()
                this.updateVisibleData()
              }
            }
          }
        })
    }
  }
})
</script>

<style lang="scss">
.virtual-list {
  position: relative;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  
  .list-phantom {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    z-index: -1;
  }
  
  .list-content {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    will-change: transform;
  }
  
  .refresh-tip {
    position: absolute;
    left: 0;
    right: 0;
    top: -100rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100rpx;
    transition: transform 0.2s;
    
    .refresh-content {
      display: flex;
      align-items: center;
      
      .loading-icon {
        width: 36rpx;
        height: 36rpx;
        margin-right: 10rpx;
        border: 3rpx solid #ddd;
        border-top-color: #07c160;
        border-radius: 50%;
        
        .refreshing & {
          animation: refresh-rotate 0.8s linear infinite;
        }
      }
      
      text {
        font-size: 28rpx;
        color: #999;
      }
    }
  }
  
  .scroll-bottom {
    position: fixed;
    right: 30rpx;
    bottom: 120rpx;
    width: 80rpx;
    height: 80rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      font-size: 40rpx;
      color: #fff;
    }
    
    &:active {
      opacity: 0.8;
    }
  }
}

@keyframes refresh-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 