<template>
  <view class="nav-bar" :style="navBarStyle">
    <!-- 状态栏占位 -->
    <view 
      class="status-bar"
      :style="{ height: statusBarHeight + 'px' }"
    ></view>
    
    <!-- 导航栏内容 -->
    <view class="nav-content">
      <!-- 返回按钮 -->
      <view 
        v-if="showBack"
        class="nav-back"
        @tap="onBack"
      >
        <text class="iconfont icon-back"></text>
        <text v-if="backText" class="back-text">{{ backText }}</text>
      </view>
      
      <!-- 标题 -->
      <view class="nav-title" :class="{ 'nav-title-center': titleCenter }">
        <text v-if="loading" class="title-loading"></text>
        <text v-else class="title-text">{{ title }}</text>
        <text v-if="subtitle" class="subtitle-text">{{ subtitle }}</text>
      </view>
      
      <!-- 右侧按钮 -->
      <view class="nav-right">
        <slot name="right">
          <view 
            v-for="(button, index) in rightButtons"
            :key="index"
            class="right-button"
            :class="{ 'button-disabled': button.disabled }"
            @tap="onRightButtonTap(button)"
          >
            <text 
              v-if="button.icon" 
              class="iconfont"
              :class="button.icon"
            ></text>
            <text 
              v-if="button.text"
              class="button-text"
              :class="{ 'has-icon': button.icon }"
            >{{ button.text }}</text>
          </view>
        </slot>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'

export interface NavButton {
  text?: string
  icon?: string
  disabled?: boolean
  handler?: () => void | Promise<void>
}

export default defineComponent({
  name: 'NavBar',

  props: {
    // 标题
    title: {
      type: String,
      default: ''
    },
    // 副标题
    subtitle: {
      type: String,
      default: ''
    },
    // 标题是否居中
    titleCenter: {
      type: Boolean,
      default: true
    },
    // 是否显示返回按钮
    showBack: {
      type: Boolean,
      default: true
    },
    // 返回按钮文字
    backText: {
      type: String,
      default: ''
    },
    // 右侧按钮配置
    rightButtons: {
      type: Array as () => NavButton[],
      default: () => []
    },
    // 是否加载中
    loading: {
      type: Boolean,
      default: false
    },
    // 背景色
    background: {
      type: String,
      default: '#ffffff'
    },
    // 是否显示底部边框
    border: {
      type: Boolean,
      default: true
    },
    // 是否使用渐变背景
    gradient: {
      type: Boolean,
      default: false
    }
  },

  emits: ['back'],

  setup(props, { emit }) {
    // 获取状态栏高度
    const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

    // 导航栏样式
    const navBarStyle = computed(() => {
      const style: Record<string, string> = {
        background: props.gradient
          ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,1) 100%)'
          : props.background
      }
      
      if (props.border) {
        style.borderBottom = '1rpx solid #eee'
      }
      
      return style
    })

    // 返回按钮处理
    const onBack = () => {
      emit('back')
      
      // 如果没有自定义处理，则执行默认返回
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      }
    }

    // 右侧按钮点击处理
    const onRightButtonTap = async (button: NavButton) => {
      if (button.disabled) return
      
      try {
        await button.handler?.()
      } catch (e) {
        console.error('右侧按钮点击处理失败:', e)
      }
    }

    return {
      statusBarHeight,
      navBarStyle,
      onBack,
      onRightButtonTap
    }
  }
})
</script>

<style lang="scss">
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
  .nav-content {
    position: relative;
    display: flex;
    align-items: center;
    height: 88rpx;
    padding: 0 30rpx;
    
    .nav-back {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 20rpx;
      margin-left: -20rpx;
      
      .iconfont {
        font-size: 36rpx;
        color: #333;
      }
      
      .back-text {
        font-size: 28rpx;
        color: #333;
        margin-left: 4rpx;
      }
      
      &:active {
        opacity: 0.7;
      }
    }
    
    .nav-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 20rpx;
      
      &.nav-title-center {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        pointer-events: none;
      }
      
      .title-text {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }
      
      .subtitle-text {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
      }
      
      .title-loading {
        width: 36rpx;
        height: 36rpx;
        border: 3rpx solid #ddd;
        border-top-color: #07c160;
        border-radius: 50%;
        animation: nav-loading 0.8s linear infinite;
        margin: 0 auto;
      }
    }
    
    .nav-right {
      display: flex;
      align-items: center;
      
      .right-button {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 20rpx;
        
        .iconfont {
          font-size: 40rpx;
          color: #333;
        }
        
        .button-text {
          font-size: 28rpx;
          color: #333;
          
          &.has-icon {
            margin-left: 4rpx;
          }
        }
        
        &.button-disabled {
          opacity: 0.4;
          pointer-events: none;
        }
        
        &:active {
          opacity: 0.7;
        }
      }
    }
  }
}

@keyframes nav-loading {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 