interface UploadTask {
  id: string
  file: File | UniApp.ChooseImageSuccessCallbackResultFile
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  progress: number
  error?: string
  url?: string
  onProgress?: (progress: number) => void
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

interface File {
  path: string
  size: number
  name: string
  type: string
}

class UploadManager {
  private static instance: UploadManager
  private tasks: Map<string, UploadTask> = new Map()
  private queue: string[] = []
  private maxConcurrent = 3
  private currentUploading = 0
  private uploadUrl: string

  private constructor() {
    // 从配置获取上传地址
    this.uploadUrl = uni.getStorageSync('upload_url') || '/api/upload'
    this.loadTasks()
    
    // 监听应用状态
    uni.onAppShow(() => {
      this.resumeAllTasks()
    })
  }

  static getInstance(): UploadManager {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager()
    }
    return UploadManager.instance
  }

  /**
   * 添加上传任务
   */
  addTask(file: File | UniApp.ChooseImageSuccessCallbackResultFile, options: {
    onProgress?: (progress: number) => void
    onSuccess?: (url: string) => void
    onError?: (error: string) => void
  } = {}): string {
    const id = this.generateTaskId()
    const task: UploadTask = {
      id,
      file,
      status: 'pending',
      progress: 0,
      ...options
    }

    this.tasks.set(id, task)
    this.queue.push(id)
    this.saveTasks()
    this.processQueue()

    return id
  }

  /**
   * 暂停任务
   */
  pauseTask(id: string) {
    const task = this.tasks.get(id)
    if (task && task.status === 'uploading') {
      task.status = 'paused'
      this.saveTasks()
      this.processQueue()
    }
  }

  /**
   * 恢复任务
   */
  resumeTask(id: string) {
    const task = this.tasks.get(id)
    if (task && task.status === 'paused') {
      task.status = 'pending'
      this.queue.push(id)
      this.saveTasks()
      this.processQueue()
    }
  }

  /**
   * 取消任务
   */
  cancelTask(id: string) {
    const task = this.tasks.get(id)
    if (task) {
      if (task.status === 'uploading') {
        this.currentUploading--
      }
      this.tasks.delete(id)
      this.queue = this.queue.filter(qid => qid !== id)
      this.saveTasks()
      this.processQueue()
    }
  }

  /**
   * 重试任务
   */
  retryTask(id: string) {
    const task = this.tasks.get(id)
    if (task && task.status === 'error') {
      task.status = 'pending'
      task.progress = 0
      task.error = undefined
      this.queue.push(id)
      this.saveTasks()
      this.processQueue()
    }
  }

  /**
   * 获取任务信息
   */
  getTask(id: string): UploadTask | undefined {
    return this.tasks.get(id)
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * 恢复所有暂停的任务
   */
  private resumeAllTasks() {
    for (const task of this.tasks.values()) {
      if (task.status === 'paused') {
        task.status = 'pending'
        this.queue.push(task.id)
      }
    }
    this.processQueue()
  }

  /**
   * 处理上传队列
   */
  private async processQueue() {
    if (this.queue.length === 0 || this.currentUploading >= this.maxConcurrent) {
      return
    }

    const taskId = this.queue.shift()
    if (!taskId) return

    const task = this.tasks.get(taskId)
    if (!task) return

    this.currentUploading++
    task.status = 'uploading'
    this.saveTasks()

    try {
      const url = await this.uploadFile(task)
      task.status = 'completed'
      task.url = url
      task.onSuccess?.(url)
    } catch (error) {
      task.status = 'error'
      task.error = error.message || '上传失败'
      task.onError?.(task.error)
    } finally {
      this.currentUploading--
      this.saveTasks()
      this.processQueue()
    }
  }

  /**
   * 上传文件
   */
  private uploadFile(task: UploadTask): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadTask = uni.uploadFile({
        url: this.uploadUrl,
        filePath: task.file.path,
        name: 'file',
        formData: {
          type: task.file.type,
          name: task.file.name
        },
        success: res => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              resolve(data.url)
            } catch {
              reject(new Error('解析响应失败'))
            }
          } else {
            reject(new Error(`上传失败: ${res.statusCode}`))
          }
        },
        fail: err => {
          reject(new Error(err.errMsg))
        }
      })

      uploadTask.onProgressUpdate(res => {
        task.progress = res.progress
        task.onProgress?.(res.progress)
        this.saveTasks()
      })
    })
  }

  /**
   * 保存任务信息
   */
  private saveTasks() {
    try {
      const tasksData = Array.from(this.tasks.entries())
      uni.setStorageSync('upload_tasks', JSON.stringify(tasksData))
    } catch (e) {
      console.error('保存上传任务失败:', e)
    }
  }

  /**
   * 加载任务信息
   */
  private loadTasks() {
    try {
      const tasksData = uni.getStorageSync('upload_tasks')
      if (tasksData) {
        const tasks = JSON.parse(tasksData)
        this.tasks = new Map(tasks)
        
        // 重置中断的任务状态
        for (const task of this.tasks.values()) {
          if (task.status === 'uploading') {
            task.status = 'pending'
            this.queue.push(task.id)
          }
        }
      }
    } catch (e) {
      console.error('加载上传任务失败:', e)
    }
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }
}

export const uploadManager = UploadManager.getInstance() 