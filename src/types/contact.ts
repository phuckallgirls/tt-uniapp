/**
 * 联系人信息接口
 */
export interface Contact {
    userid: number;           // 用户ID
    username: string;         // 用户名
    nickname: string;         // 昵称
    avatar: string;          // 头像
    signature?: string;      // 个性签名
    gender: number;          // 性别 0-未知 1-男 2-女
    online: boolean;         // 在线状态
    remarkName?: string;     // 备注名
    group?: string;          // 分组名称
    letter?: string;         // 首字母（用于索引）
}

/**
 * 联系人分组接口
 */
export interface ContactGroup {
    name: string;            // 分组名称
    contacts: Contact[];     // 分组内的联系人
} 