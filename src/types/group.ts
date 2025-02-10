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
    owner: string;         // 群主ID
    type: GroupType;       // 群组类型
    memberCount: number;   // 成员数量
    maxMemberCount: number;// 最大成员数量
    createTime: number;    // 创建时间
    admins: string[];     // 管理员ID列表
    memberList: GroupMember[];// 成员列表
    announcement?: string; // 群公告
    lastActiveTime?: number;// 群最后活跃时间
}

/**
 * 群组成员信息
 */
export interface GroupMember {
    userId: string;        // 用户ID
    nickname: string;      // 群昵称
    avatar: string;        // 头像
    joinTime: number;      // 加入时间
    role: 'owner' | 'admin' | 'member'; // 新增角色区分
    lastActiveTime?: number;// 新增最后活跃时间
}

// 新增群成员操作权限
export interface GroupPermission {
    canManageMembers: boolean;      // 是否可以管理成员
    canModifyGroupInfo: boolean;    // 是否可以修改群信息
    canRemoveMembers: boolean;      // 是否可以移除成员
} 