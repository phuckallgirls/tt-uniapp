/**
 * 好友请求状态
 */
export enum FriendRequestStatus {
    PENDING = 0,    // 待处理
    ACCEPTED = 1,   // 已接受
    REJECTED = 2,   // 已拒绝
    IGNORED = 3     // 已忽略
}

/**
 * 好友请求
 */
export interface FriendRequest {
    id: string;                    // 请求ID
    fromUserId: number;            // 发送者ID
    fromUsername: string;          // 发送者用户名
    fromNickname: string;          // 发送者昵称
    fromAvatar: string;            // 发送者头像
    toUserId: number;              // 接收者ID
    message: string;               // 验证消息
    status: FriendRequestStatus;   // 请求状态
    createTime: number;            // 创建时间
    handleTime?: number;           // 处理时间
} 