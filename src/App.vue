<script setup lang="ts">
import { onLaunch, onHide } from '@dcloudio/uni-app'
import { websocket } from './utils/websocket'
import { useUserStore } from './stores/user'

onLaunch(() => {
  const userStore = useUserStore()
  // 如果已登录，则连接websocket
  if (userStore.token) {
    websocket.connect()
  }
})

onHide(() => {
  // 应用进入后台时关闭连接
  websocket.close()
})
</script>

<style lang="scss">
@import './styles/animation.scss';

/* 每个页面公共css */
page {
  background-color: #f5f5f5;
}

/* 统一字体 */
text {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
    Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei',
    sans-serif;
}
</style>
