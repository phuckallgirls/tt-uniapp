import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo } from '@/types/user';

export const useUserStore = defineStore('user', () => {
    // 用户信息
    const userInfo = ref<UserInfo | null>(null);
    // 登录状态
    const isLoggedIn = ref(false);
    // token
    const token = ref('');

    // 设置用户信息
    function setUserInfo(info: UserInfo) {
        userInfo.value = info;
        isLoggedIn.value = true;
    }

    // 清除用户信息
    function clearUserInfo() {
        userInfo.value = null;
        isLoggedIn.value = false;
        token.value = '';
    }

    return {
        userInfo,
        isLoggedIn,
        token,
        setUserInfo,
        clearUserInfo,
    };
}); 