<template>
    <view class="group-detail">
        <!-- 基本信息卡片 -->
        <view class="info-card">
            <view class="avatar-section" @tap="handleChangeAvatar">
                <image class="avatar" :src="groupInfo.avatar || defaultGroupAvatar" mode="aspectFill" />
                <view class="change-text" v-if="isOwner">更换群头像</view>
            </view>
            <view class="info-section">
                <view class="name-row">
                    <text class="name">{{ groupInfo.name }}</text>
                    <text class="id">ID: {{ groupInfo.id }}</text>
                </view>
                <view class="member-count">
                    {{ groupInfo.memberCount }}/{{ groupInfo.maxMembers }}人
                </view>
            </view>
        </view>

        <!-- 群公告 -->
        <view class="announcement-card">
            <view class="card-header">
                <text class="title">群公告</text>
                <text class="edit" v-if="isOwnerOrAdmin" @tap="handleEditAnnouncement">编辑</text>
            </view>
            <view class="content">
                {{ groupInfo.announcement || '暂无群公告' }}
            </view>
        </view>

        <!-- 群成员列表 -->
        <view class="members-card">
            <view class="card-header">
                <text class="title">群成员</text>
                <text class="manage" v-if="isOwnerOrAdmin" @tap="handleManageMembers">管理</text>
            </view>
            <view class="member-grid">
                <view 
                    v-for="member in members" 
                    :key="member.userId" 
                    class="member-item"
                    @tap="handleMemberTap(member)"
                >
                    <image class="avatar" :src="member.avatar || defaultAvatar" mode="aspectFill" />
                    <text class="nickname">{{ member.nickname }}</text>
                    <text class="role-tag" v-if="member.role === GroupRole.OWNER">群主</text>
                    <text class="role-tag admin" v-else-if="member.role === GroupRole.ADMIN">管理员</text>
                </view>
                <view class="member-item add" v-if="canInvite" @tap="handleInviteMembers">
                    <text class="iconfont icon-add"></text>
                    <text class="text">邀请</text>
                </view>
            </view>
        </view>

        <!-- 功能按钮组 -->
        <view class="function-group">
            <button class="function-btn" @tap="handleClearHistory">清空聊天记录</button>
            <button class="function-btn warning" @tap="handleQuitGroup">
                {{ isOwner ? '解散群组' : '退出群组' }}
            </button>
        </view>

        <!-- 编辑公告弹窗 -->
        <uni-popup ref="announcementPopup" type="center">
            <view class="edit-popup">
                <view class="popup-header">
                    <text class="title">编辑群公告</text>
                    <text class="close" @tap="closeAnnouncementPopup">×</text>
                </view>
                <view class="popup-content">
                    <textarea
                        v-model="editingAnnouncement"
                        class="announcement-input"
                        placeholder="请输入群公告"
                        maxlength="200"
                    />
                    <text class="word-count">{{ editingAnnouncement.length }}/200</text>
                </view>
                <view class="popup-footer">
                    <button class="cancel-btn" @tap="closeAnnouncementPopup">取消</button>
                    <button class="confirm-btn" @tap="submitAnnouncement">确定</button>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { GroupRole, type GroupInfo, type GroupMember } from '@/types/group';

const userStore = useUserStore();
const defaultAvatar = '/static/images/avatar/default.png';
const defaultGroupAvatar = '/static/images/avatar/group.png';

// 群组信息
const groupInfo = ref<GroupInfo>({
    id: '',
    name: '',
    avatar: '',
    description: '',
    owner: 0,
    type: 1,
    memberCount: 0,
    maxMembers: 500,
    createTime: 0,
    joinMode: 0
});

// 群成员列表
const members = ref<GroupMember[]>([]);

// 编辑公告
const editingAnnouncement = ref('');
const announcementPopup = ref();

// 是否是群主
const isOwner = computed(() => {
    return groupInfo.value.owner === userStore.userInfo?.userid;
});

// 是否是群主或管理员
const isOwnerOrAdmin = computed(() => {
    const currentMember = members.value.find(m => m.userId === userStore.userInfo?.userid);
    return currentMember?.role === GroupRole.OWNER || currentMember?.role === GroupRole.ADMIN;
});

// 是否可以邀请成员
const canInvite = computed(() => {
    return isOwnerOrAdmin.value || groupInfo.value.joinMode === 0;
});

/**
 * 加载群组信息
 */
const loadGroupInfo = async () => {
    try {
        // TODO: 通过 WebSocket 获取群组信息
        // const response = await getGroupInfo(groupId);
        // groupInfo.value = response.data;
    } catch (error) {
        console.error('加载群组信息失败:', error);
        uni.showToast({
            title: '加载失败',
            icon: 'none'
        });
    }
};

/**
 * 加载群成员列表
 */
const loadMembers = async () => {
    try {
        // TODO: 通过 WebSocket 获取群成员列表
        // const response = await getGroupMembers(groupId);
        // members.value = response.data;
    } catch (error) {
        console.error('加载群成员失败:', error);
        uni.showToast({
            title: '加载失败',
            icon: 'none'
        });
    }
};

/**
 * 处理更换群头像
 */
const handleChangeAvatar = async () => {
    if (!isOwner.value) return;
    
    // TODO: 实现群头像上传
};

/**
 * 处理编辑公告
 */
const handleEditAnnouncement = () => {
    editingAnnouncement.value = groupInfo.value.announcement || '';
    announcementPopup.value.open();
};

/**
 * 关闭公告编辑弹窗
 */
const closeAnnouncementPopup = () => {
    announcementPopup.value.close();
};

/**
 * 提交公告
 */
const submitAnnouncement = async () => {
    try {
        uni.showLoading({ title: '保存中...' });
        // TODO: 通过 WebSocket 更新群公告
        // await updateGroupAnnouncement(groupInfo.value.id, editingAnnouncement.value);
        
        groupInfo.value.announcement = editingAnnouncement.value;
        closeAnnouncementPopup();
        
        uni.showToast({
            title: '保存成功',
            icon: 'success'
        });
    } catch (error) {
        console.error('更新公告失败:', error);
        uni.showToast({
            title: '保存失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 处理管理成员
 */
const handleManageMembers = () => {
    uni.navigateTo({
        url: `/pages/group/members?id=${groupInfo.value.id}`
    });
};

/**
 * 处理邀请成员
 */
const handleInviteMembers = () => {
    uni.navigateTo({
        url: `/pages/group/invite?id=${groupInfo.value.id}`
    });
};

/**
 * 处理成员点击
 */
const handleMemberTap = (member: GroupMember) => {
    if (member.userId === userStore.userInfo?.userid) return;
    
    uni.navigateTo({
        url: `/pages/chat/index?type=single&id=${member.userId}&name=${member.nickname}`
    });
};

/**
 * 处理清空聊天记录
 */
const handleClearHistory = () => {
    uni.showModal({
        title: '提示',
        content: '确定要清空聊天记录吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    uni.showLoading({ title: '清空中...' });
                    // TODO: 通过 WebSocket 清空聊天记录
                    // await clearGroupHistory(groupInfo.value.id);
                    
                    uni.showToast({
                        title: '已清空',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('清空失败:', error);
                    uni.showToast({
                        title: '清空失败',
                        icon: 'none'
                    });
                } finally {
                    uni.hideLoading();
                }
            }
        }
    });
};

/**
 * 处理退出/解散群组
 */
const handleQuitGroup = () => {
    const action = isOwner.value ? '解散' : '退出';
    uni.showModal({
        title: '提示',
        content: `确定要${action}该群组吗？`,
        success: async (res) => {
            if (res.confirm) {
                try {
                    uni.showLoading({ title: `${action}中...` });
                    // TODO: 通过 WebSocket 退出/解散群组
                    // if (isOwner.value) {
                    //     await dismissGroup(groupInfo.value.id);
                    // } else {
                    //     await quitGroup(groupInfo.value.id);
                    // }
                    
                    uni.showToast({
                        title: `${action}成功`,
                        icon: 'success'
                    });
                    
                    setTimeout(() => {
                        uni.navigateBack();
                    }, 1500);
                } catch (error) {
                    console.error(`${action}失败:`, error);
                    uni.showToast({
                        title: `${action}失败`,
                        icon: 'none'
                    });
                } finally {
                    uni.hideLoading();
                }
            }
        }
    });
};

// 页面加载
onLoad(async (options: any) => {
    const { id } = options;
    if (!id) {
        uni.showToast({
            title: '参数错误',
            icon: 'none'
        });
        uni.navigateBack();
        return;
    }
    
    groupInfo.value.id = id;
    await Promise.all([
        loadGroupInfo(),
        loadMembers()
    ]);
});
</script>

<style lang="scss">
.group-detail {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 20rpx;

    .info-card {
        background-color: #fff;
        border-radius: 20rpx;
        padding: 30rpx;
        margin-bottom: 20rpx;
        display: flex;
        align-items: center;

        .avatar-section {
            position: relative;
            margin-right: 30rpx;

            .avatar {
                width: 120rpx;
                height: 120rpx;
                border-radius: 20rpx;
            }

            .change-text {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 40rpx;
                background: rgba(0, 0, 0, 0.5);
                color: #fff;
                font-size: 20rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                border-bottom-left-radius: 20rpx;
                border-bottom-right-radius: 20rpx;
            }
        }

        .info-section {
            flex: 1;

            .name-row {
                margin-bottom: 10rpx;

                .name {
                    font-size: 36rpx;
                    color: #2d3436;
                    font-weight: bold;
                    margin-right: 20rpx;
                }

                .id {
                    font-size: 24rpx;
                    color: #8a8a8a;
                }
            }

            .member-count {
                font-size: 26rpx;
                color: #636e72;
            }
        }
    }

    .announcement-card, .members-card {
        background-color: #fff;
        border-radius: 20rpx;
        padding: 30rpx;
        margin-bottom: 20rpx;

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20rpx;

            .title {
                font-size: 32rpx;
                color: #2d3436;
                font-weight: bold;
            }

            .edit, .manage {
                font-size: 28rpx;
                color: #6c5ce7;
            }
        }

        .content {
            font-size: 28rpx;
            color: #636e72;
            line-height: 1.6;
        }
    }

    .members-card {
        .member-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 20rpx;

            .member-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;

                .avatar {
                    width: 100rpx;
                    height: 100rpx;
                    border-radius: 50rpx;
                    margin-bottom: 10rpx;
                }

                .nickname {
                    font-size: 24rpx;
                    color: #2d3436;
                    width: 100%;
                    text-align: center;
                    @include text-ellipsis;
                }

                .role-tag {
                    position: absolute;
                    right: 0;
                    top: 0;
                    padding: 4rpx 8rpx;
                    background-color: #6c5ce7;
                    border-radius: 8rpx;
                    font-size: 20rpx;
                    color: #fff;

                    &.admin {
                        background-color: #00b894;
                    }
                }

                &.add {
                    .iconfont {
                        width: 100rpx;
                        height: 100rpx;
                        background-color: #f5f6fa;
                        border-radius: 50rpx;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 40rpx;
                        color: #8a8a8a;
                        margin-bottom: 10rpx;
                    }

                    .text {
                        font-size: 24rpx;
                        color: #8a8a8a;
                    }
                }
            }
        }
    }

    .function-group {
        margin-top: 40rpx;

        .function-btn {
            width: 100%;
            height: 90rpx;
            background-color: #fff;
            border-radius: 45rpx;
            color: #2d3436;
            font-size: 32rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20rpx;

            &.warning {
                background-color: #ff3b30;
                color: #fff;
            }
        }
    }

    .edit-popup {
        width: 600rpx;
        background-color: #fff;
        border-radius: 20rpx;
        overflow: hidden;

        .popup-header {
            padding: 30rpx;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2rpx solid #f5f6fa;

            .title {
                font-size: 32rpx;
                color: #2d3436;
                font-weight: bold;
            }

            .close {
                font-size: 40rpx;
                color: #8a8a8a;
                padding: 0 20rpx;
            }
        }

        .popup-content {
            padding: 30rpx;
            position: relative;

            .announcement-input {
                width: 100%;
                height: 300rpx;
                background-color: #f5f6fa;
                border-radius: 12rpx;
                padding: 20rpx;
                font-size: 28rpx;
            }

            .word-count {
                position: absolute;
                right: 40rpx;
                bottom: 40rpx;
                font-size: 24rpx;
                color: #8a8a8a;
            }
        }

        .popup-footer {
            display: flex;
            border-top: 2rpx solid #f5f6fa;

            button {
                flex: 1;
                height: 90rpx;
                font-size: 32rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0;

                &.cancel-btn {
                    background-color: #fff;
                    color: #636e72;
                }

                &.confirm-btn {
                    background: linear-gradient(45deg, #6c5ce7, #a363d9);
                    color: #fff;
                }
            }
        }
    }
}
</style> 