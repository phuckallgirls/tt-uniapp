let loadingCount = 0
let loadingTimer: any = null

export const feedback = {
  /**
   * 显示加载提示
   */
  showLoading(options: { text?: string; mask?: boolean } = {}) {
    loadingCount++
    if (loadingCount === 1) {
      uni.showLoading({
        title: options.text || '加载中...',
        mask: options.mask !== false
      })
    }
  },

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    loadingCount--
    if (loadingCount <= 0) {
      loadingCount = 0
      uni.hideLoading()
    }
  },

  /**
   * 显示轻提示
   */
  toast(options: { text: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) {
    const { text, type = 'info', duration = 2000 } = options
    
    let icon: 'success' | 'error' | 'none' = 'none'
    switch (type) {
      case 'success':
        icon = 'success'
        break
      case 'error':
        icon = 'error'
        break
    }

    uni.showToast({
      title: text,
      icon,
      duration
    })
  },

  /**
   * 显示确认对话框
   */
  async confirm(options: { 
    title?: string
    content: string
    confirmText?: string
    cancelText?: string
  }): Promise<boolean> {
    try {
      await uni.showModal({
        title: options.title || '提示',
        content: options.content,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消'
      })
      return true
    } catch {
      return false
    }
  },

  /**
   * 显示底部操作菜单
   */
  async actionSheet(options: {
    title?: string
    items: { text: string; color?: string }[]
  }): Promise<number> {
    try {
      const res = await uni.showActionSheet({
        title: options.title,
        itemList: options.items.map(item => item.text),
        itemColor: options.items[0]?.color
      })
      return res.tapIndex
    } catch {
      return -1
    }
  },

  /**
   * 显示节流toast，防止重复提示
   */
  throttleToast(options: { text: string; duration?: number }) {
    if (loadingTimer) {
      clearTimeout(loadingTimer)
    }
    
    loadingTimer = setTimeout(() => {
      this.toast(options)
      loadingTimer = null
    }, 300)
  },

  /**
   * 震动反馈
   */
  vibrate(type: 'light' | 'medium' | 'heavy' = 'light') {
    const duration = {
      light: 15,
      medium: 30,
      heavy: 40
    }
    uni.vibrateShort({
      success: () => {
        setTimeout(() => {
          uni.vibrateShort()
        }, duration[type])
      }
    })
  }
} 