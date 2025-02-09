<template>
    <view class="edit-profile">
        <!-- 头像编辑区 -->
        <view class="avatar-section">
            <view class="avatar-wrapper" @tap="handleChangeAvatar">
                <image class="avatar" :src="form.avatar || defaultAvatar" mode="aspectFill" />
                <view class="change-text">点击更换头像</view>
            </view>
        </view>

        <!-- 信息编辑表单 -->
        <view class="form-section">
            <view class="form-group">
                <view class="form-item">
                    <text class="label">昵称</text>
                    <input
                        class="input"
                        type="text"
                        v-model="form.nickname"
                        placeholder="请输入昵称"
                        maxlength="20"
                    />
                </view>
                <view class="form-item">
                    <text class="label">性别</text>
                    <picker
                        class="picker"
                        :range="genderOptions"
                        range-key="label"
                        :value="getGenderIndex()"
                        @change="handleGenderChange"
                    >
                        <view class="picker-text">
                            {{ getGenderText(form.gender) }}
                            <text class="iconfont icon-right"></text>
                        </view>
                    </picker>
                </view>
            </view>

            <view class="form-group">
                <view class="form-item">
                    <text class="label">个性签名</text>
                    <textarea
                        class="textarea"
                        v-model="form.signature"
                        placeholder="介绍一下自己吧"
                        maxlength="100"
                        :show-confirm-bar="false"
                    />
                    <text class="word-count">{{ form.signature?.length || 0 }}/100</text>
                </view>
            </view>

            <view class="form-group">
                <view class="form-item">
                    <text class="label">生日</text>
                    <picker
                        class="picker"
                        mode="date"
                        :value="getBirthdayString()"
                        @change="handleBirthdayChange"
                    >
                        <view class="picker-text">
                            {{ getBirthdayString() || '请选择生日' }}
                            <text class="iconfont icon-right"></text>
                        </view>
                    </picker>
                </view>
                <view class="form-item">
                    <text class="label">所在地</text>
                    <input
                        class="input"
                        type="text"
                        v-model="form.location"
                        placeholder="请输入所在地"
                    />
                </view>
            </view>

            <view class="form-group">
                <view class="form-item">
                    <text class="label">手机号</text>
                    <input
                        class="input"
                        type="number"
                        v-model="form.phoneNumber"
                        placeholder="请输入手机号"
                        maxlength="11"
                    />
                </view>
                <view class="form-item">
                    <text class="label">邮箱</text>
                    <input
                        class="input"
                        type="text"
                        v-model="form.email"
                        placeholder="请输入邮箱"
                    />
                </view>
            </view>
        </view>

        <!-- 保存按钮 -->
        <view class="save-btn" :class="{ 'btn-disabled': !isFormChanged }" @tap="handleSave">
            保存修改
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UserProfile } from '@/types/profile';
import { Gender } from '@/types/profile';
import { useUserStore } from '@/stores/user';
import dayjs from 'dayjs';

const userStore = useUserStore();
const defaultAvatar = '/static/images/avatar/default.png';

// 性别选项
const genderOptions = [
    { value: Gender.UNKNOWN, label: '未设置' },
    { value: Gender.MALE, label: '男' },
    { value: Gender.FEMALE, label: '女' }
];

// 表单数据
const form = ref<Partial<UserProfile>>({
    ...userStore.userInfo,
    gender: Gender.UNKNOWN,
    birthday: undefined,
    location: '',
    signature: '',
    phoneNumber: '',
    email: ''
});

// 原始数据（用于比较是否有修改）
const originalForm = ref({ ...form.value });

/**
 * 判断表单是否有修改
 */
const isFormChanged = computed(() => {
    return JSON.stringify(form.value) !== JSON.stringify(originalForm.value);
});

/**
 * 获取性别文本
 */
const getGenderText = (gender: Gender): string => {
    return genderOptions.find(option => option.value === gender)?.label || '未设置';
};

/**
 * 获取性别选项索引
 */
const getGenderIndex = (): number => {
    return genderOptions.findIndex(option => option.value === form.value.gender);
};

/**
 * 处理性别选择
 */
const handleGenderChange = (e: any) => {
    const index = e.detail.value;
    form.value.gender = genderOptions[index].value;
};

/**
 * 获取生日字符串
 */
const getBirthdayString = (): string => {
    return form.value.birthday ? dayjs(form.value.birthday).format('YYYY-MM-DD') : '';
};

/**
 * 处理生日选择
 */
const handleBirthdayChange = (e: any) => {
    form.value.birthday = dayjs(e.detail.value).valueOf();
};

/**
 * 处理更换头像
 */
const handleChangeAvatar = () => {
    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
            const tempFilePath = res.tempFilePaths[0];
            try {
                uni.showLoading({ title: '上传中...' });
                // TODO: 通过 WebSocket 上传头像到 Flamingo 服务器
                // const result = await uploadAvatar(tempFilePath);
                // form.value.avatar = result.url;
                
                // 临时直接使用本地路径
                form.value.avatar = tempFilePath;
            } catch (error) {
                console.error('上传头像失败:', error);
                uni.showToast({
                    title: '上传头像失败',
                    icon: 'none'
                });
            } finally {
                uni.hideLoading();
            }
        }
    });
};

/**
 * 处理保存
 */
const handleSave = async () => {
    if (!isFormChanged.value) return;

    try {
        uni.showLoading({ title: '保存中...' });
        
        // TODO: 通过 WebSocket 发送更新请求到 Flamingo 服务器
        // const response = await updateProfile(form.value);
        
        // 更新本地存储
        userStore.setUserInfo({
            ...userStore.userInfo,
            ...form.value
        });

        uni.showToast({
            title: '保存成功',
            icon: 'success'
        });

        // 返回上一页
        setTimeout(() => {
            uni.navigateBack();
        }, 1500);
    } catch (error) {
        console.error('保存失败:', error);
        uni.showToast({
            title: '保存失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

// 加载用户信息
onMounted(async () => {
    try {
        // TODO: 通过 WebSocket 获取完整的用户信息
        // const response = await getUserProfile();
        // form.value = response.data;
        // originalForm.value = { ...response.data };
    } catch (error) {
        console.error('加载用户信息失败:', error);
        uni.showToast({
            title: '加载用户信息失败',
            icon: 'none'
        });
    }
});
</script>

<style lang="scss">
.edit-profile {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 30rpx;

    .avatar-section {
        display: flex;
        justify-content: center;
        margin-bottom: 40rpx;

        .avatar-wrapper {
            position: relative;
            width: 180rpx;
            height: 180rpx;
            border-radius: 90rpx;
            overflow: hidden;
            box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

            .avatar {
                width: 100%;
                height: 100%;
            }

            .change-text {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 50rpx;
                background: rgba(0, 0, 0, 0.5);
                color: #fff;
                font-size: 24rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    .form-section {
        .form-group {
            background-color: #fff;
            border-radius: 20rpx;
            margin-bottom: 20rpx;
            box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

            .form-item {
                padding: 30rpx;
                border-bottom: 2rpx solid #f5f6fa;
                position: relative;

                &:last-child {
                    border-bottom: none;
                }

                .label {
                    font-size: 28rpx;
                    color: #8a8a8a;
                    margin-bottom: 16rpx;
                    display: block;
                }

                .input {
                    width: 100%;
                    height: 60rpx;
                    font-size: 32rpx;
                    color: #2d3436;
                }

                .textarea {
                    width: 100%;
                    height: 160rpx;
                    font-size: 32rpx;
                    color: #2d3436;
                }

                .word-count {
                    position: absolute;
                    right: 30rpx;
                    bottom: 30rpx;
                    font-size: 24rpx;
                    color: #8a8a8a;
                }

                .picker {
                    width: 100%;
                    height: 60rpx;

                    .picker-text {
                        font-size: 32rpx;
                        color: #2d3436;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;

                        .icon-right {
                            font-size: 36rpx;
                            color: #8a8a8a;
                        }
                    }
                }
            }
        }
    }

    .save-btn {
        margin-top: 60rpx;
        height: 90rpx;
        background: linear-gradient(45deg, #6c5ce7, #a363d9);
        border-radius: 45rpx;
        color: #fff;
        font-size: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        &.btn-disabled {
            opacity: 0.7;
            background: #b2bec3;
        }
    }
}
</style> 