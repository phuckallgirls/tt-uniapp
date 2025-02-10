import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo } from '@/types/user';
import { websocket } from '../utils/websocket'

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
        websocket.connect()
    }

    // 清除用户信息
    function clearUserInfo() {
        userInfo.value = null;
        isLoggedIn.value = false;
        token.value = '';
        websocket.close()
    }

    // 在登录成功后连接
    const login = async () => {
        // ... 现有的登录逻辑 ...
        websocket.connect()
    }

    // 在登出时断开连接
    const logout = () => {
        // ... 现有的登出逻辑 ...
        websocket.close()
    }

    return {
        userInfo,
        isLoggedIn,
        token,
        setUserInfo,
        clearUserInfo,
        login,
        logout,
    };
}); 