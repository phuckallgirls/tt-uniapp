// 上传类型枚举
export enum UploadType {
    IMAGE = 'image',
    VOICE = 'voice',
    FILE = 'file'
}

// 上传结果接口
export interface UploadResult {
    url: string;        // 文件访问URL
    path: string;       // 文件存储路径
    size: number;       // 文件大小
    name: string;       // 文件名
    type: string;       // 文件类型
    uploadTime: number; // 上传时间戳
} 