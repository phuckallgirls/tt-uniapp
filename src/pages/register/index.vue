<template>
    <view class="register-container">
        <!-- 顶部装饰波浪 -->
        <view class="wave-box">
            <view class="wave" />
        </view>

        <!-- 注册表单 -->
        <view class="form-container">
            <view class="title">创建账号</view>
            <view class="subtitle">加入 Flamingo 开始聊天</view>

            <view class="form-item">
                <input
                    v-model="form.username"
                    class="input"
                    type="text"
                    placeholder="用户名（至少3个字符）"
                    @input="validateForm"
                />
            </view>

            <view class="form-item">
                <input
                    v-model="form.nickname"
                    class="input"
                    type="text"
                    placeholder="昵称"
                    @input="validateForm"
                />
            </view>

            <view class="form-item">
                <input
                    v-model="form.password"
                    class="input"
                    type="password"
                    placeholder="密码（至少6个字符）"
                    @input="validateForm"
                />
            </view>

            <view class="form-item">
                <input
                    v-model="form.confirmPassword"
                    class="input"
                    type="password"
                    placeholder="确认密码"
                    @input="validateForm"
                />
            </view>

            <button
                class="register-btn"
                :disabled="!isFormValid"
                :class="{ 'btn-disabled': !isFormValid }"
                @tap="handleRegister"
            >
                注册
            </button>

            <view class="login-link">
                已有账号？
                <text class="link" @tap="goToLogin">立即登录</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RegisterForm } from '@/types/user';

// 表单数据
const form = ref<RegisterForm>({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: ''
});

// 表单验证
const isFormValid = computed(() => {
    return (
        form.value.username.length >= 3 &&
        form.value.password.length >= 6 &&
        form.value.password === form.value.confirmPassword &&
        form.value.nickname.length > 0
    );
});

// 验证表单
const validateForm = () => {
    if (form.value.username.length < 3) {
        uni.showToast({
            title: '用户名至少3个字符',
            icon: 'none'
        });
        return false;
    }
    if (form.value.password.length < 6) {
        uni.showToast({
            title: '密码至少6个字符',
            icon: 'none'
        });
        return false;
    }
    if (form.value.password !== form.value.confirmPassword) {
        uni.showToast({
            title: '两次密码不一致',
            icon: 'none'
        });
        return false;
    }
    if (!form.value.nickname) {
        uni.showToast({
            title: '请输入昵称',
            icon: 'none'
        });
        return false;
    }
    return true;
};

// 处理注册
const handleRegister = async () => {
    if (!validateForm()) return;

    try {
        uni.showLoading({
            title: '注册中...'
        });

        // TODO: 调用注册接口
        // const response = await register(form.value);
        
        // 模拟注册成功
        setTimeout(() => {
            uni.hideLoading();
            uni.showToast({
                title: '注册成功',
                icon: 'success'
            });
            
            // 延迟跳转到登录页
            setTimeout(() => {
                goToLogin();
            }, 1500);
        }, 1500);
    } catch (error) {
        uni.hideLoading();
        uni.showToast({
            title: '注册失败',
            icon: 'error'
        });
    }
};

// 跳转到登录页
const goToLogin = () => {
    uni.navigateBack();
};

// 监听页面加载
onLoad(() => {
    uni.setNavigationBarTitle({
        title: '注册'
    });
});

// 监听页面卸载
onUnload(() => {
    // 清理工作
});
</script>

<style lang="scss">
.register-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    position: relative;
    overflow: hidden;

    .wave-box {
        height: 35vh;
        background: linear-gradient(45deg, #6c5ce7, #a363d9);
        position: relative;
        overflow: hidden;

        .wave {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100px;
            background: url('../../static/images/wave.png') repeat-x;
            background-size: 1000px 100px;
            animation: wave 10s linear infinite;
            transform-origin: center bottom;
        }
    }

    .form-container {
        position: relative;
        margin-top: -60rpx;
        padding: 40rpx;
        background: #fff;
        border-radius: 40rpx 40rpx 0 0;
        box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);

        .title {
            font-size: 48rpx;
            font-weight: bold;
            color: #2d3436;
            margin-bottom: 20rpx;
        }

        .subtitle {
            font-size: 28rpx;
            color: #636e72;
            margin-bottom: 60rpx;
        }

        .form-item {
            margin-bottom: 30rpx;

            .input {
                width: 100%;
                height: 90rpx;
                background: #f5f6fa;
                border-radius: 45rpx;
                padding: 0 40rpx;
                font-size: 28rpx;
                color: #2d3436;
                
                &:focus {
                    background: #fff;
                    box-shadow: 0 0 0 2rpx #6c5ce7;
                }
            }
        }

        .register-btn {
            width: 100%;
            height: 90rpx;
            background: linear-gradient(45deg, #6c5ce7, #a363d9);
            border-radius: 45rpx;
            color: #fff;
            font-size: 32rpx;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40rpx;
            border: none;

            &.btn-disabled {
                opacity: 0.7;
                background: #b2bec3;
            }
        }

        .login-link {
            text-align: center;
            font-size: 26rpx;
            color: #636e72;

            .link {
                color: #6c5ce7;
                font-weight: bold;
            }
        }
    }
}

@keyframes wave {
    0% {
        background-position: 0;
    }
    100% {
        background-position: 1000px;
    }
}
</style> 