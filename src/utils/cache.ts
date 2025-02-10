import { MessageCache } from '../types/message'

class MessageCacheManager {
  private readonly CACHE_PREFIX = 'msg_cache_'
  private readonly IMAGE_CACHE_PREFIX = 'img_cache_'
  private readonly MAX_CACHE_SIZE = 100 // 最大缓存消息数
  private readonly CACHE_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000 // 7天过期

  /**
   * 保存会话消息到本地
   * @param sessionId 会话ID
   * @param messages 消息列表
   */
  public saveSessionMessages(sessionId: string, messages: any[]): void {
    try {
      const key = `${this.CACHE_PREFIX}${sessionId}`
      uni.setStorageSync(key, JSON.stringify(messages))
    } catch (e) {
      console.error('保存消息缓存失败:', e)
    }
  }

  /**
   * 获取会话消息
   * @param sessionId 会话ID
   * @param page 页码
   * @param pageSize 每页数量
   */
  public getSessionMessages(sessionId: string, page: number, pageSize: number): any[] {
    try {
      const key = `${this.CACHE_PREFIX}${sessionId}`
      const messages = JSON.parse(uni.getStorageSync(key) || '[]')
      const start = (page - 1) * pageSize
      return messages.slice(start, start + pageSize)
    } catch (e) {
      console.error('获取消息缓存失败:', e)
      return []
    }
  }

  /**
   * 缓存图片
   * @param url 图片URL
   */
  public async cacheImage(url: string): Promise<string> {
    const key = `${this.IMAGE_CACHE_PREFIX}${url}`
    try {
      // 检查缓存
      const cache: MessageCache = uni.getStorageSync(key)
      if (cache && cache.expireTime > Date.now()) {
        const fs = uni.getFileSystemManager()
        try {
          fs.accessSync(cache.localPath)
          return cache.localPath
        } catch (e) {
          uni.removeStorageSync(key)
        }
      }

      // 下载并缓存
      const res = await uni.downloadFile({
        url: url
      })

      if (res.statusCode === 200) {
        const cacheData: MessageCache = {
          id: url,
          localPath: res.tempFilePath,
          createTime: Date.now(),
          expireTime: Date.now() + this.CACHE_EXPIRE_TIME
        }
        uni.setStorageSync(key, cacheData)
        return res.tempFilePath
      }
      return url
    } catch (e) {
      console.error('图片缓存失败:', e)
      return url
    }
  }

  /**
   * 清理过期缓存
   */
  public clearExpiredCache(): void {
    try {
      const storage = uni.getStorageInfoSync()
      storage.keys.forEach(key => {
        if (key.startsWith(this.IMAGE_CACHE_PREFIX)) {
          const cache: MessageCache = uni.getStorageSync(key)
          if (cache && cache.expireTime < Date.now()) {
            uni.removeStorageSync(key)
          }
        }
      })
    } catch (e) {
      console.error('清理缓存失败:', e)
    }
  }
}

export const messageCacheManager = new MessageCacheManager() 