/**
 * 群组角色
 */
export enum GroupRole {
    OWNER = 1,     // 群主
    ADMIN = 2,     // 管理员
    MEMBER = 3     // 普通成员
}

/**
 * 群组类型
 */
export enum GroupType {
    NORMAL = 1,    // 普通群
    SUPER = 2      // 超级群
}

/**
 * 群组信息
 */
export interface GroupInfo {
    id: string;            // 群组ID
    name: string;          // 群组名称
    avatar: string;        // 群组头像
    description: string;   // 群组描述
    owner: number;         // 群主ID
    type: GroupType;       // 群组类型
    memberCount: number;   // 成员数量
    maxMembers: number;    // 最大成员数
    createTime: number;    // 创建时间
    announcement?: string; // 群公告
    joinMode: number;      // 加群方式：0-自由加入 1-需要验证 2-禁止加入
}

/**
 * 群组成员信息
 */
export interface GroupMember {
    groupId: string;       // 群组ID
    userId: number;        // 用户ID
    nickname: string;      // 群昵称
    role: GroupRole;       // 角色
    joinTime: number;      // 加入时间
    lastActiveTime: number;// 最后活跃时间
    avatar: string;        // 头像
    username: string;      // 用户名
} 