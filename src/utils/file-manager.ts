interface FileCache {
  url: string
  path: string
  size: number
  lastAccess: number
  type: string
}

interface DownloadTask {
  url: string
  progress: number
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  error?: string
  onProgress?: (progress: number) => void
  onComplete?: (path: string) => void
  onError?: (error: string) => void
}

class FileManager {
  private static instance: FileManager
  private cacheMap: Map<string, FileCache> = new Map()
  private downloadTasks: Map<string, DownloadTask> = new Map()
  private maxCacheSize = 100 * 1024 * 1024 // 100MB
  private currentCacheSize = 0
  
  private constructor() {
    this.loadCacheInfo()
    // 定期清理缓存
    setInterval(() => this.cleanCache(), 30 * 60 * 1000)
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager()
    }
    return FileManager.instance
  }

  /**
   * 获取文件
   * 优先从缓存获取，没有则下载
   */
  async getFile(url: string, options: {
    onProgress?: (progress: number) => void
    forceDownload?: boolean
  } = {}): Promise<string> {
    // 检查缓存
    if (!options.forceDownload) {
      const cache = this.cacheMap.get(url)
      if (cache) {
        try {
          const exists = await this.checkFileExists(cache.path)
          if (exists) {
            cache.lastAccess = Date.now()
            this.saveCacheInfo()
            return cache.path
          }
        } catch (e) {
          console.error('检查缓存文件失败:', e)
        }
      }
    }

    // 下载文件
    return this.downloadFile(url, options)
  }

  /**
   * 下载文件
   */
  private downloadFile(url: string, options: {
    onProgress?: (progress: number) => void
  } = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      // 检查是否已有下载任务
      let task = this.downloadTasks.get(url)
      if (task) {
        if (task.status === 'completed') {
          const cache = this.cacheMap.get(url)
          if (cache) resolve(cache.path)
          return
        }
        
        if (task.status === 'downloading') {
          task.onComplete = path => resolve(path)
          task.onError = error => reject(error)
          task.onProgress = options.onProgress
          return
        }
      }

      // 创建新的下载任务
      task = {
        url,
        progress: 0,
        status: 'downloading',
        onProgress: options.onProgress,
        onComplete: path => resolve(path),
        onError: error => reject(error)
      }
      
      this.downloadTasks.set(url, task)

      // 开始下载
      const downloadTask = uni.downloadFile({
        url,
        success: async res => {
          if (res.statusCode === 200) {
            try {
              // 保存到缓存
              const fileInfo = await this.saveToCache(url, res.tempFilePath)
              task!.status = 'completed'
              task!.onComplete?.(fileInfo.path)
            } catch (e) {
              task!.status = 'error'
              task!.error = '保存文件失败'
              task!.onError?.(task!.error)
            }
          } else {
            task!.status = 'error'
            task!.error = `下载失败: ${res.statusCode}`
            task!.onError?.(task!.error)
          }
        },
        fail: err => {
          task!.status = 'error'
          task!.error = err.errMsg
          task!.onError?.(task!.error)
        }
      })

      // 监听下载进度
      downloadTask.onProgressUpdate(res => {
        task!.progress = res.progress
        task!.onProgress?.(res.progress)
      })
    })
  }

  /**
   * 保存文件到缓存
   */
  private async saveToCache(url: string, tempPath: string): Promise<FileCache> {
    const stats = await this.getFileStats(tempPath)
    const ext = this.getFileExtension(url)
    const fileName = `${this.hashCode(url)}${ext}`
    const cachePath = `${uni.env.USER_DATA_PATH}/file_cache/${fileName}`

    // 确保缓存目录存在
    await this.ensureDir(`${uni.env.USER_DATA_PATH}/file_cache`)

    // 移动文件到缓存目录
    await this.moveFile(tempPath, cachePath)

    // 更新缓存信息
    const fileInfo: FileCache = {
      url,
      path: cachePath,
      size: stats.size,
      lastAccess: Date.now(),
      type: ext.slice(1) || 'unknown'
    }

    this.currentCacheSize += stats.size
    this.cacheMap.set(url, fileInfo)
    this.saveCacheInfo()

    // 检查是否需要清理缓存
    if (this.currentCacheSize > this.maxCacheSize) {
      this.cleanCache()
    }

    return fileInfo
  }

  /**
   * 清理缓存
   */
  private async cleanCache() {
    if (this.currentCacheSize <= this.maxCacheSize) return

    // 按最后访问时间排序
    const cacheList = Array.from(this.cacheMap.entries())
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess)

    for (const [url, cache] of cacheList) {
      try {
        await this.deleteFile(cache.path)
        this.currentCacheSize -= cache.size
        this.cacheMap.delete(url)
        
        if (this.currentCacheSize <= this.maxCacheSize * 0.8) {
          break
        }
      } catch (e) {
        console.error('删除缓存文件失败:', e)
      }
    }

    this.saveCacheInfo()
  }

  /**
   * 保存缓存信息
   */
  private saveCacheInfo() {
    try {
      const cacheInfo = {
        size: this.currentCacheSize,
        files: Array.from(this.cacheMap.entries())
      }
      uni.setStorageSync('file_cache_info', JSON.stringify(cacheInfo))
    } catch (e) {
      console.error('保存缓存信息失败:', e)
    }
  }

  /**
   * 加载缓存信息
   */
  private loadCacheInfo() {
    try {
      const cacheInfo = uni.getStorageSync('file_cache_info')
      if (cacheInfo) {
        const { size, files } = JSON.parse(cacheInfo)
        this.currentCacheSize = size
        this.cacheMap = new Map(files)
      }
    } catch (e) {
      console.error('加载缓存信息失败:', e)
    }
  }

  // 工具方法
  private async checkFileExists(path: string): Promise<boolean> {
    try {
      await this.getFileStats(path)
      return true
    } catch {
      return false
    }
  }

  private getFileStats(path: string): Promise<UniApp.GetFileInfoSuccess> {
    return new Promise((resolve, reject) => {
      uni.getFileInfo({
        filePath: path,
        success: resolve,
        fail: reject
      })
    })
  }

  private moveFile(src: string, dst: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.copyFile({
        srcPath: src,
        destPath: dst,
        success: () => resolve(),
        fail: reject
      })
    })
  }

  private deleteFile(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.removeSavedFile({
        filePath: path,
        success: () => resolve(),
        fail: reject
      })
    })
  }

  private ensureDir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      uni.mkdir({
        dirPath: path,
        recursive: true,
        success: () => resolve(),
        fail: err => {
          if (err.errMsg.includes('file already exists')) {
            resolve()
          } else {
            reject(err)
          }
        }
      })
    })
  }

  private getFileExtension(url: string): string {
    const match = url.match(/\.[^./?#]+$/)
    return match ? match[0].toLowerCase() : ''
  }

  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  }
}

export const fileManager = FileManager.getInstance() 