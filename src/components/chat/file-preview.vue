<template>
    <view class="file-preview">
        <!-- 文件信息区域 -->
        <view class="file-info">
            <!-- 文件图标 -->
            <view class="file-icon">
                <text 
                    class="iconfont"
                    :class="fileIconClass"
                ></text>
            </view>

            <!-- 文件详情 -->
            <view class="file-details">
                <text class="file-name">{{ fileName }}</text>
                <text class="file-size">{{ formatFileSize(fileSize) }}</text>
            </view>
        </view>

        <!-- 操作区域 -->
        <view class="file-actions">
            <!-- 下载进度 -->
            <view 
                class="progress-bar"
                v-if="downloading"
            >
                <view 
                    class="progress"
                    :style="{ width: `${downloadProgress}%` }"
                ></view>
                <text class="progress-text">{{ downloadProgress }}%</text>
            </view>

            <!-- 操作按钮 -->
            <view 
                v-else 
                class="action-buttons"
            >
                <!-- 预览按钮 -->
                <button 
                    class="preview-btn"
                    v-if="canPreview"
                    @tap="handlePreview"
                >
                    预览
                </button>

                <!-- 下载按钮 -->
                <button 
                    class="download-btn"
                    :disabled="downloading"
                    @tap="handleDownload"
                >
                    {{ downloaded ? '已下载' : '下载' }}
                </button>
            </view>
        </view>

        <!-- 错误提示 -->
        <view 
            class="error-tip"
            v-if="errorMessage"
        >
            {{ errorMessage }}
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// 组件属性定义
const props = defineProps<{
    fileUrl: string;      // 文件URL
    fileName: string;     // 文件名
    fileSize: number;     // 文件大小（字节）
    fileType?: string;    // 文件类型（MIME类型）
}>();

// 事件定义
const emit = defineEmits<{
    (e: 'download-success', filePath: string): void;    // 下载成功
    (e: 'download-error', error: Error): void;          // 下载失败
    (e: 'preview-error', error: Error): void;           // 预览失败
}>();

// 状态管理
const downloading = ref(false);           // 是否正在下载
const downloadProgress = ref(0);          // 下载进度
const downloaded = ref(false);            // 是否已下载
const errorMessage = ref('');             // 错误信息
const localFilePath = ref('');            // 本地文件路径

// 计算属性
// 文件图标类名
const fileIconClass = computed(() => {
    const type = props.fileType || '';
    if (type.startsWith('image/')) return 'icon-image';
    if (type.startsWith('video/')) return 'icon-video';
    if (type.startsWith('audio/')) return 'icon-audio';
    if (type.includes('pdf')) return 'icon-pdf';
    if (type.includes('word')) return 'icon-word';
    if (type.includes('excel')) return 'icon-excel';
    if (type.includes('powerpoint')) return 'icon-ppt';
    return 'icon-file';
});

// 是否可以预览
const canPreview = computed(() => {
    const type = props.fileType || '';
    return type.startsWith('image/') || 
           type.startsWith('video/') ||
           type.includes('pdf');
});

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 下载文件
const handleDownload = async () => {
    if (downloading.value || downloaded.value) return;

    try {
        downloading.value = true;
        errorMessage.value = '';

        // 开始下载
        const downloadTask = uni.downloadFile({
            url: props.fileUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    // 保存文件
                    uni.saveFile({
                        tempFilePath: res.tempFilePath,
                        success: (saveRes) => {
                            localFilePath.value = saveRes.savedFilePath;
                            downloaded.value = true;
                            emit('download-success', saveRes.savedFilePath);
                        },
                        fail: (error) => {
                            throw new Error('保存文件失败：' + error.errMsg);
                        }
                    });
                } else {
                    throw new Error('下载失败：' + res.statusCode);
                }
            },
            fail: (error) => {
                throw new Error('下载失败：' + error.errMsg);
            }
        });

        // 监听下载进度
        downloadTask.onProgressUpdate((res) => {
            downloadProgress.value = res.progress;
        });

    } catch (error: any) {
        errorMessage.value = error.message;
        emit('download-error', error);
    } finally {
        downloading.value = false;
    }
};

// 预览文件
const handlePreview = async () => {
    try {
        errorMessage.value = '';
        const filePath = localFilePath.value || props.fileUrl;
        
        // 根据文件类型选择预览方式
        const fileType = props.fileType || '';
        if (fileType.startsWith('image/')) {
            uni.previewImage({
                urls: [filePath]
            });
        } else if (fileType.startsWith('video/')) {
            uni.navigateTo({
                url: `/pages/common/video-player?url=${encodeURIComponent(filePath)}`
            });
        } else {
            // 使用系统文档预览
            uni.openDocument({
                filePath: localFilePath.value, // 必须是本地文件路径
                success: () => {
                    console.log('打开文档成功');
                },
                fail: (error) => {
                    throw new Error('打开文档失败：' + error.errMsg);
                }
            });
        }
    } catch (error: any) {
        errorMessage.value = error.message;
        emit('preview-error', error);
    }
};
</script>

<style lang="scss">
.file-preview {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 30rpx;
    margin: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);

    // 文件信息区域
    .file-info {
        display: flex;
        align-items: center;
        margin-bottom: 30rpx;

        // 文件图标
        .file-icon {
            width: 80rpx;
            height: 80rpx;
            background-color: #f5f6fa;
            border-radius: 12rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20rpx;

            .iconfont {
                font-size: 48rpx;
                color: #6c5ce7;
            }
        }

        // 文件详情
        .file-details {
            flex: 1;
            overflow: hidden;

            .file-name {
                font-size: 32rpx;
                color: #2d3436;
                @include text-ellipsis;
            }

            .file-size {
                font-size: 24rpx;
                color: #636e72;
                margin-top: 8rpx;
            }
        }
    }

    // 操作区域
    .file-actions {
        // 进度条
        .progress-bar {
            height: 6rpx;
            background-color: #f5f6fa;
            border-radius: 3rpx;
            overflow: hidden;
            position: relative;

            .progress {
                height: 100%;
                background-color: #6c5ce7;
                transition: width 0.2s;
            }

            .progress-text {
                position: absolute;
                right: 0;
                top: 12rpx;
                font-size: 24rpx;
                color: #636e72;
            }
        }

        // 操作按钮
        .action-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 20rpx;

            button {
                min-width: 160rpx;
                height: 64rpx;
                line-height: 64rpx;
                font-size: 28rpx;
                border-radius: 32rpx;
                padding: 0 30rpx;

                &.preview-btn {
                    background-color: #f5f6fa;
                    color: #2d3436;
                }

                &.download-btn {
                    background-color: #6c5ce7;
                    color: #fff;

                    &:disabled {
                        background-color: #b2bec3;
                    }
                }
            }
        }
    }

    // 错误提示
    .error-tip {
        margin-top: 20rpx;
        font-size: 24rpx;
        color: #ff7675;
        text-align: center;
    }
}
</style> 