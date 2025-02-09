/**
 * 用户状态
 */
export enum UserStatus {
    ONLINE = 1,    // 在线
    OFFLINE = 2,   // 离线
    BUSY = 3,      // 忙碌
    AWAY = 4       // 离开
}

/**
 * 用户性别
 */
export enum Gender {
    UNKNOWN = 0,   // 未知
    MALE = 1,      // 男
    FEMALE = 2     // 女
}

/**
 * 用户详细信息
 */
export interface UserProfile extends UserInfo {
    status: UserStatus;      // 在线状态
    gender: Gender;          // 性别
    birthday?: number;       // 生日时间戳
    location?: string;       // 位置
    signature?: string;      // 个性签名
    phoneNumber?: string;    // 手机号
    email?: string;         // 邮箱
    registerTime: number;    // 注册时间
    lastLoginTime: number;   // 最后登录时间
}

/**
 * 用户设置
 */
export interface UserSettings {
    messageNotification: boolean;    // 消息通知
    soundEnabled: boolean;           // 声音
    vibrationEnabled: boolean;       // 震动
    showOnlineStatus: boolean;       // 显示在线状态
    autoAcceptFriends: boolean;      // 自动接受好友请求
} 