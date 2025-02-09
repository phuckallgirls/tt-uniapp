import type { UploadType, UploadResult } from '@/types/upload';

/**
 * 文件上传工具类
 */
export class UploadManager {
    private static instance: UploadManager;
    private uploadUrl: string = ''; // Flamingo Gateway 的文件上传地址

    private constructor() {
        // 单例模式
    }

    public static getInstance(): UploadManager {
        if (!UploadManager.instance) {
            UploadManager.instance = new UploadManager();
        }
        return UploadManager.instance;
    }

    /**
     * 初始化上传地址
     */
    public init(url: string) {
        this.uploadUrl = url;
    }

    /**
     * 上传文件
     * @param filePath 本地文件路径
     * @param type 上传类型
     * @param options 额外选项
     */
    public async uploadFile(
        filePath: string,
        type: UploadType,
        options: {
            onProgress?: (progress: number) => void;
            compression?: boolean;
        } = {}
    ): Promise<UploadResult> {
        const { onProgress, compression = true } = options;

        // 如果是图片且需要压缩
        if (type === UploadType.IMAGE && compression) {
            const compressedPath = await this.compressImage(filePath);
            filePath = compressedPath;
        }

        // 获取文件信息
        const fileInfo = await this.getFileInfo(filePath);

        return new Promise((resolve, reject) => {
            const uploadTask = uni.uploadFile({
                url: this.uploadUrl,
                filePath,
                name: 'file',
                formData: {
                    type: type.toString(),
                    name: fileInfo.name,
                    size: fileInfo.size.toString()
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        try {
                            const result = JSON.parse(res.data);
                            resolve({
                                url: result.url,
                                path: result.path,
                                size: fileInfo.size,
                                name: fileInfo.name,
                                type: fileInfo.type,
                                uploadTime: Date.now()
                            });
                        } catch (error) {
                            reject(new Error('上传响应解析失败'));
                        }
                    } else {
                        reject(new Error(`上传失败: ${res.statusCode}`));
                    }
                },
                fail: (error) => {
                    reject(new Error(`上传失败: ${error.errMsg}`));
                }
            });

            // 监听上传进度
            if (onProgress) {
                uploadTask.onProgressUpdate((res) => {
                    onProgress(res.progress);
                });
            }
        });
    }

    /**
     * 压缩图片
     */
    private async compressImage(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            uni.compressImage({
                src: filePath,
                quality: 80,
                success: (res) => {
                    resolve(res.tempFilePath);
                },
                fail: (error) => {
                    console.warn('图片压缩失败，使用原图:', error);
                    resolve(filePath);
                }
            });
        });
    }

    /**
     * 获取文件信息
     */
    private async getFileInfo(filePath: string): Promise<{
        name: string;
        size: number;
        type: string;
    }> {
        return new Promise((resolve, reject) => {
            uni.getFileInfo({
                filePath,
                success: (res) => {
                    const name = filePath.split('/').pop() || 'unknown';
                    const ext = name.split('.').pop()?.toLowerCase() || '';
                    resolve({
                        name,
                        size: res.size,
                        type: this.getFileType(ext)
                    });
                },
                fail: (error) => {
                    reject(new Error(`获取文件信息失败: ${error.errMsg}`));
                }
            });
        });
    }

    /**
     * 获取文件类型
     */
    private getFileType(ext: string): string {
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoExts = ['mp4', 'mov', 'avi', 'wmv'];
        const audioExts = ['mp3', 'wav', 'aac', 'ogg'];

        if (imageExts.includes(ext)) {
            return 'image/' + ext;
        } else if (videoExts.includes(ext)) {
            return 'video/' + ext;
        } else if (audioExts.includes(ext)) {
            return 'audio/' + ext;
        } else {
            return 'application/octet-stream';
        }
    }

    /**
     * 选择文件
     */
    public async chooseFile(type: UploadType): Promise<string> {
        switch (type) {
            case UploadType.IMAGE:
                return this.chooseImage();
            case UploadType.VOICE:
                return this.chooseVoice();
            case UploadType.FILE:
                return this.chooseDocument();
            default:
                throw new Error('不支持的文件类型');
        }
    }

    /**
     * 选择图片
     */
    private async chooseImage(): Promise<string> {
        return new Promise((resolve, reject) => {
            uni.chooseImage({
                count: 1,
                sizeType: ['original', 'compressed'],
                sourceType: ['album', 'camera'],
                success: (res) => {
                    resolve(res.tempFilePaths[0]);
                },
                fail: (error) => {
                    reject(new Error(`选择图片失败: ${error.errMsg}`));
                }
            });
        });
    }

    /**
     * 选择语音
     */
    private async chooseVoice(): Promise<string> {
        return new Promise((resolve, reject) => {
            uni.chooseMessageFile({
                count: 1,
                type: 'file',
                extension: ['.mp3', '.wav', '.aac'],
                success: (res) => {
                    resolve(res.tempFiles[0].path);
                },
                fail: (error) => {
                    reject(new Error(`选择语音失败: ${error.errMsg}`));
                }
            });
        });
    }

    /**
     * 选择文档
     */
    private async chooseDocument(): Promise<string> {
        return new Promise((resolve, reject) => {
            uni.chooseMessageFile({
                count: 1,
                type: 'file',
                success: (res) => {
                    resolve(res.tempFiles[0].path);
                },
                fail: (error) => {
                    reject(new Error(`选择文件失败: ${error.errMsg}`));
                }
            });
        });
    }
}

export const uploadManager = UploadManager.getInstance(); 