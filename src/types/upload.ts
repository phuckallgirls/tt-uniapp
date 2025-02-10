export interface UploadFileResult {
  url: string
  size: number
  name: string
  type: string
}

export interface UploadTask {
  taskId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'fail'
  result?: UploadFileResult
  error?: string
}

