import { UploadFileResult } from '../types/upload'
import { request } from './request'

class UploadManager {
  private readonly MAX_RETRY_TIMES = 3
  private readonly CHUNK_SIZE = 1024 * 1024 // 1MB
  private readonly IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

  /**
   * 上传图片
   * @param tempFilePath 临时文件路径
   * @param options 上传选项
   * @returns 上传结果
   */
  public async uploadImage(
    tempFilePath: string,
    options: {
      compress?: boolean
      quality?: number
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<UploadFileResult> {
    const { compress = true, quality = 80 } = options

    try {
      // 获取文件信息
      const fileInfo = await uni.getFileInfo({
        filePath: tempFilePath
      })

      // 检查文件大小
      if (fileInfo.size > this.MAX_IMAGE_SIZE) {
        throw new Error(`图片大小不能超过${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`)
      }

      // 检查文件类型
      const extension = tempFilePath.split('.').pop()?.toLowerCase()
      if (!extension || !this.IMAGE_EXTENSIONS.includes(extension)) {
        throw new Error('不支持的图片格式')
      }

      // 压缩图片
      let uploadPath = tempFilePath
      if (compress && ['jpg', 'jpeg', 'png'].includes(extension)) {
        const compressRes = await uni.compressImage({
          src: tempFilePath,
          quality
        })
        uploadPath = compressRes.tempFilePath
      }

      // 上传图片
      return await this.uploadFile(uploadPath, options.onProgress)
    } catch (e) {
      throw new Error(`图片上传失败: ${e.message}`)
    }
  }

  /**
   * 上传文件
   * @param tempFilePath 临时文件路径
   * @param onProgress 进度回调
   * @returns 上传结果
   */
  public async uploadFile(
    tempFilePath: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadFileResult> {
    try {
      // 获取文件信息
      const fileInfo = await uni.getFileInfo({
        filePath: tempFilePath
      })

      // 检查文件大小
      if (fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error(`文件大小不能超过${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
      }

      let retryCount = 0
      while (retryCount < this.MAX_RETRY_TIMES) {
        try {
          const result = await this.doUpload(tempFilePath, onProgress)
          return result
        } catch (e) {
          retryCount++
          if (retryCount === this.MAX_RETRY_TIMES) {
            throw e
          }
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      throw new Error('上传失败，请重试')
    } catch (e) {
      throw new Error(`文件上传失败: ${e.message}`)
    }
  }

  /**
   * 执行上传
   * @param tempFilePath 临时文件路径
   * @param onProgress 进度回调
   * @returns 上传结果
   */
  private async doUpload(
    tempFilePath: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadFileResult> {
    return new Promise((resolve, reject) => {
      const uploadTask = uni.uploadFile({
        url: '/api/upload',
        filePath: tempFilePath,
        name: 'file',
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0 && data.data) {
              resolve({
                url: data.data.url,
                size: data.data.size,
                name: data.data.name,
                type: data.data.type
              })
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '上传失败'))
        }
      })

      if (onProgress && uploadTask) {
        uploadTask.onProgressUpdate((res) => {
          onProgress(res.progress)
        })
      }
    })
  }

  /**
   * 取消上传
   * @param taskId 上传任务ID
   */
  public cancelUpload(taskId: string): void {
    const uploadTask = uni.uploadFile({
      url: '/api/upload',
      filePath: '',
      name: 'file'
    })
    uploadTask.abort()
  }
}

export const uploadManager = new UploadManager()
