<template>
  <view 
    class="page-transition"
    :class="[
      type,
      direction,
      { 'is-transition': isTransition }
    ]"
  >
    <slot></slot>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PageTransition',

  props: {
    // 动画类型：slide/fade/popup/scale
    type: {
      type: String,
      default: 'slide'
    },
    // 滑动方向：left/right
    direction: {
      type: String,
      default: 'left'
    },
    // 是否启用过渡
    transition: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    isTransition(): boolean {
      return this.transition && this.type !== 'none'
    }
  }
})
</script>

<style lang="scss">
.page-transition {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #fff;
  
  &.is-transition {
    transition: all 0.3s ease-out;
  }
  
  // 滑动动画
  &.slide {
    &.left {
      &.enter {
        transform: translateX(100%);
      }
      
      &.leave {
        transform: translateX(-30%);
      }
    }
    
    &.right {
      &.enter {
        transform: translateX(-100%);
      }
      
      &.leave {
        transform: translateX(30%);
      }
    }
  }
  
  // 淡入淡出
  &.fade {
    &.enter {
      opacity: 0;
    }
    
    &.leave {
      opacity: 0;
    }
  }
  
  // 弹出动画
  &.popup {
    &.enter {
      transform: translateY(100%);
    }
    
    &.leave {
      transform: translateY(100%);
    }
  }
  
  // 缩放动画
  &.scale {
    &.enter {
      transform: scale(0.9);
      opacity: 0;
    }
    
    &.leave {
      transform: scale(0.9);
      opacity: 0;
    }
  }
}
</style> 