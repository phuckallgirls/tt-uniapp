<template>
    <view class="login-container">
        <!-- 顶部装饰波浪 -->
        <view class="wave-box">
            <view class="wave" />
        </view>

        <!-- 登录表单 -->
        <view class="form-container">
            <view class="title">欢迎回来</view>
            <view class="subtitle">登录您的账号</view>

            <view class="form-item">
                <input
                    v-model="form.username"
                    class="input"
                    type="text"
                    placeholder="用户名"
                    @input="validateForm"
                />
            </view>

            <view class="form-item">
                <input
                    v-model="form.password"
                    class="input"
                    type="password"
                    placeholder="密码"
                    @input="validateForm"
                />
            </view>

            <view class="remember-box">
                <label class="checkbox">
                    <checkbox
                        v-model="form.remember"
                        color="#6c5ce7"
                    />
                    记住我
                </label>
                <text class="forget-text" @tap="onForgetPassword">忘记密码？</text>
            </view>

            <button
                class="login-btn"
                :disabled="!isFormValid"
                :class="{ 'btn-disabled': !isFormValid }"
                @tap="handleLogin"
            >
                登录
            </button>

            <view class="register-link">
                还没有账号？
                <text class="link" @tap="goToRegister">立即注册</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LoginForm } from '@/types/user';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// 表单数据
const form = ref<LoginForm>({
    username: '',
    password: '',
    remember: false,
});

// 表单验证
const isFormValid = computed(() => {
    return form.value.username.length >= 3 && form.value.password.length >= 6;
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
    return true;
};

// 处理登录
const handleLogin = async () => {
    try {
        uni.showLoading({
            title: '登录中...',
        });

        // TODO: 调用登录接口
        // const response = await login(form.value);
        
        // 模拟登录成功
        setTimeout(() => {
            uni.hideLoading();
            uni.showToast({
                title: '登录成功',
                icon: 'success',
            });
            
            // 跳转到主页
            uni.reLaunch({
                url: '/pages/chats/index',
            });
        }, 1500);
    } catch (error) {
        uni.hideLoading();
        uni.showToast({
            title: '登录失败',
            icon: 'error',
        });
    }
};

// 跳转到注册页
const goToRegister = () => {
    uni.navigateTo({
        url: '/pages/register/index',
    });
};

// 忘记密码
const onForgetPassword = () => {
    uni.showToast({
        title: '暂不支持找回密码',
        icon: 'none'
    });
};
</script>

<style lang="scss">
.login-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    position: relative;
    overflow: hidden;

    .wave-box {
        height: 40vh;
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

        .remember-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40rpx;

            .checkbox {
                font-size: 26rpx;
                color: #636e72;
            }

            .forget-text {
                font-size: 26rpx;
                color: #6c5ce7;
            }
        }

        .login-btn {
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

        .register-link {
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