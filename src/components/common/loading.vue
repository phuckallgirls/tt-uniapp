<template>
  <view class="loading-component" :class="{ 'fullscreen': fullscreen }">
    <view class="loading-content">
      <view class="loading-spinner">
        <view 
          v-for="n in 12" 
          :key="n"
          :style="{ transform: `rotate(${n * 30}deg)`, animationDelay: `${(n - 1) * 0.1}s` }"
          class="spinner-line"
        ></view>
      </view>
      <text v-if="text" class="loading-text">{{ text }}</text>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Loading',

  props: {
    text: {
      type: String,
      default: '加载中...'
    },
    fullscreen: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style lang="scss">
.loading-component {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .loading-spinner {
      position: relative;
      width: 60rpx;
      height: 60rpx;
      
      .spinner-line {
        position: absolute;
        top: 0;
        left: 50%;
        width: 4rpx;
        height: 25%;
        background-color: #07c160;
        border-radius: 4rpx;
        transform-origin: center bottom;
        animation: spinnerFade 1.2s linear infinite;
      }
    }
    
    .loading-text {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #666;
    }
  }
}

@keyframes spinnerFade {
  0% { opacity: 0.85; }
  50% { opacity: 0.25; }
  100% { opacity: 0.25; }
}
</style> 