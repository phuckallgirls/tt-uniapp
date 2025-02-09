// 用户状态枚举
export enum UserStatus {
    ONLINE = 1,   // 在线
    OFFLINE = 2,  // 离线
    BUSY = 3,     // 忙碌
    AWAY = 4      // 离开
}

// 用户基本信息接口
export interface UserInfo {
    userid: number;
    username: string;
    nickname: string;
    avatar?: string;
    gender: number;
    status?: UserStatus;
}

// 登录表单接口
export interface LoginForm {
    username: string;
    password: string;
    remember: boolean;
}

// 注册表单接口
export interface RegisterForm {
    username: string;
    password: string;
    confirmPassword: string;
    nickname: string;
    gender: number;
} 