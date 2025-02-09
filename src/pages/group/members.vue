<template>
    <view class="members-manager">
        <!-- 搜索栏 -->
        <view class="search-box">
            <text class="iconfont icon-search"></text>
            <input
                v-model="searchText"
                class="search-input"
                type="text"
                placeholder="搜索群成员"
                @confirm="handleSearch"
            />
        </view>

        <!-- 成员列表 -->
        <scroll-view
            class="member-list"
            scroll-y
            :refresher-enabled="true"
            :refresher-triggered="isRefreshing"
            @refresherrefresh="handleRefresh"
            @scrolltolower="handleLoadMore"
        >
            <view 
                v-for="member in members"
                :key="member.userId"
                class="member-item"
                @tap="handleMemberTap(member)"
            >
                <image class="avatar" :src="member.avatar || defaultAvatar" mode="aspectFill" />
                <view class="info">
                    <view class="name-row">
                        <text class="nickname">{{ member.nickname }}</text>
                        <text class="role-tag" :class="getRoleClass(member.role)">
                            {{ getRoleText(member.role) }}
                        </text>
                    </view>
                    <text class="join-time">加入时间：{{ formatTime(member.joinTime) }}</text>
                </view>
                <view class="actions" v-if="canManageMember(member)">
                    <button 
                        class="action-btn"
                        :class="{ 'admin': member.role === GroupRole.ADMIN }"
                        @tap.stop="handleSetAdmin(member)"
                    >
                        {{ member.role === GroupRole.ADMIN ? '取消管理员' : '设为管理员' }}
                    </button>
                    <button 
                        class="action-btn remove"
                        @tap.stop="handleRemoveMember(member)"
                    >
                        移出群组
                    </button>
                </view>
            </view>

            <!-- 加载更多 -->
            <view v-if="hasMore" class="loading-more">
                <text v-if="isLoading">正在加载...</text>
                <text v-else>上拉加载更多</text>
            </view>
            <view v-else class="no-more">
                <text>没有更多了</text>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { GroupRole, type GroupMember } from '@/types/group';
import dayjs from 'dayjs';

const userStore = useUserStore();
const defaultAvatar = '/static/images/avatar/default.png';

// 搜索文本
const searchText = ref('');
// 成员列表
const members = ref<GroupMember[]>([]);
// 是否正在刷新
const isRefreshing = ref(false);
// 是否正在加载更多
const isLoading = ref(false);
// 是否还有更多数据
const hasMore = ref(true);
// 当前用户角色
const currentRole = ref<GroupRole>(GroupRole.MEMBER);

/**
 * 获取角色文本
 */
const getRoleText = (role: GroupRole): string => {
    const roleMap = {
        [GroupRole.OWNER]: '群主',
        [GroupRole.ADMIN]: '管理员',
        [GroupRole.MEMBER]: '成员'
    };
    return roleMap[role];
};

/**
 * 获取角色样式类
 */
const getRoleClass = (role: GroupRole): string => {
    const classMap = {
        [GroupRole.OWNER]: 'owner',
        [GroupRole.ADMIN]: 'admin',
        [GroupRole.MEMBER]: ''
    };
    return classMap[role];
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
};

/**
 * 是否可以管理该成员
 */
const canManageMember = (member: GroupMember): boolean => {
    // 群主可以管理所有人（除了自己）
    if (currentRole.value === GroupRole.OWNER) {
        return member.userId !== userStore.userInfo?.userid;
    }
    // 管理员可以管理普通成员
    if (currentRole.value === GroupRole.ADMIN) {
        return member.role === GroupRole.MEMBER;
    }
    return false;
};

/**
 * 处理搜索
 */
const handleSearch = async () => {
    if (!searchText.value.trim()) {
        return;
    }
    try {
        uni.showLoading({ title: '搜索中...' });
        // TODO: 通过 WebSocket 搜索群成员
        // const response = await searchGroupMembers(groupId, searchText.value);
        // members.value = response.data;
    } catch (error) {
        console.error('搜索失败:', error);
        uni.showToast({
            title: '搜索失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 处理刷新
 */
const handleRefresh = async () => {
    if (isRefreshing.value) return;
    isRefreshing.value = true;
    try {
        // TODO: 通过 WebSocket 获取群成员列表
        // const response = await getGroupMembers(groupId);
        // members.value = response.data;
        hasMore.value = true;
    } finally {
        isRefreshing.value = false;
        uni.stopPullDownRefresh();
    }
};

/**
 * 处理加载更多
 */
const handleLoadMore = async () => {
    if (!hasMore.value || isLoading.value) return;
    isLoading.value = true;
    try {
        // TODO: 通过 WebSocket 获取更多群成员
        // const response = await getMoreGroupMembers(groupId, members.value.length);
        // members.value.push(...response.data);
        // hasMore.value = response.hasMore;
    } finally {
        isLoading.value = false;
    }
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
 * 处理设置管理员
 */
const handleSetAdmin = async (member: GroupMember) => {
    try {
        uni.showLoading({ title: '处理中...' });
        const newRole = member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN;
        // TODO: 通过 WebSocket 设置群成员角色
        // await setGroupMemberRole(groupId, member.userId, newRole);
        
        // 更新本地数据
        const index = members.value.findIndex(m => m.userId === member.userId);
        if (index !== -1) {
            members.value[index].role = newRole;
        }
        
        uni.showToast({
            title: '设置成功',
            icon: 'success'
        });
    } catch (error) {
        console.error('设置失败:', error);
        uni.showToast({
            title: '设置失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 处理移出成员
 */
const handleRemoveMember = async (member: GroupMember) => {
    uni.showModal({
        title: '提示',
        content: `确定要将 ${member.nickname} 移出群组吗？`,
        async success(res) {
            if (res.confirm) {
                try {
                    uni.showLoading({ title: '处理中...' });
                    // TODO: 通过 WebSocket 移出群成员
                    // await removeGroupMember(groupId, member.userId);
                    
                    // 更新本地数据
                    members.value = members.value.filter(m => m.userId !== member.userId);
                    
                    uni.showToast({
                        title: '移出成功',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('移出失败:', error);
                    uni.showToast({
                        title: '移出失败',
                        icon: 'none'
                    });
                } finally {
                    uni.hideLoading();
                }
            }
        }
    });
};

// 页面加载时获取数据
onLoad(async (options) => {
    const { id } = options;
    if (!id) {
        uni.navigateBack();
        return;
    }

    try {
        uni.showLoading({ title: '加载中...' });
        // TODO: 通过 WebSocket 获取群成员列表和当前用户角色
        // const [membersRes, roleRes] = await Promise.all([
        //     getGroupMembers(id),
        //     getCurrentUserRole(id)
        // ]);
        // members.value = membersRes.data;
        // currentRole.value = roleRes.data;
    } catch (error) {
        console.error('加载失败:', error);
        uni.showToast({
            title: '加载失败',
            icon: 'none'
        });
        uni.navigateBack();
    } finally {
        uni.hideLoading();
    }
});
</script>

<style lang="scss">
.members-manager {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 30rpx;

    .search-box {
        height: 80rpx;
        background-color: #fff;
        border-radius: 40rpx;
        display: flex;
        align-items: center;
        padding: 0 30rpx;
        margin-bottom: 30rpx;

        .icon-search {
            font-size: 36rpx;
            color: #8a8a8a;
            margin-right: 20rpx;
        }

        .search-input {
            flex: 1;
            height: 100%;
            font-size: 28rpx;
        }
    }

    .member-list {
        height: calc(100vh - 140rpx);

        .member-item {
            background-color: #fff;
            border-radius: 20rpx;
            padding: 20rpx;
            margin-bottom: 20rpx;
            display: flex;
            align-items: center;

            .avatar {
                width: 100rpx;
                height: 100rpx;
                border-radius: 50rpx;
                margin-right: 20rpx;
            }

            .info {
                flex: 1;

                .name-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 10rpx;

                    .nickname {
                        font-size: 32rpx;
                        color: #2d3436;
                        margin-right: 16rpx;
                    }

                    .role-tag {
                        padding: 4rpx 12rpx;
                        background-color: #8a8a8a;
                        border-radius: 8rpx;
                        font-size: 24rpx;
                        color: #fff;

                        &.owner {
                            background-color: #6c5ce7;
                        }

                        &.admin {
                            background-color: #00b894;
                        }
                    }
                }

                .join-time {
                    font-size: 26rpx;
                    color: #636e72;
                }
            }

            .actions {
                display: flex;
                flex-direction: column;

                .action-btn {
                    width: 160rpx;
                    height: 60rpx;
                    border-radius: 30rpx;
                    font-size: 24rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10rpx;
                    background-color: #f5f6fa;
                    color: #2d3436;

                    &:last-child {
                        margin-bottom: 0;
                    }

                    &.admin {
                        background-color: #00b894;
                        color: #fff;
                    }

                    &.remove {
                        background-color: #ff3b30;
                        color: #fff;
                    }
                }
            }
        }

        .loading-more, .no-more {
            text-align: center;
            padding: 30rpx 0;
            font-size: 26rpx;
            color: #8a8a8a;
        }
    }
}
</style> 