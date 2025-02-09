<template>
    <view class="groups-container">
        <!-- 搜索栏 -->
        <view class="search-box">
            <text class="iconfont icon-search"></text>
            <input
                v-model="searchText"
                class="search-input"
                type="text"
                placeholder="搜索群组"
                @confirm="handleSearch"
            />
        </view>

        <!-- 创建群组按钮 -->
        <view class="create-group" @tap="handleCreateGroup">
            <text class="iconfont icon-add-group"></text>
            <text class="text">创建群组</text>
        </view>

        <!-- 群组列表 -->
        <scroll-view
            class="group-list"
            scroll-y
            :refresher-enabled="true"
            :refresher-triggered="isRefreshing"
            @refresherrefresh="handleRefresh"
            @scrolltolower="handleLoadMore"
        >
            <!-- 空状态 -->
            <view v-if="groups.length === 0" class="empty-state">
                <image class="empty-icon" src="/static/images/empty-groups.png" mode="aspectFit" />
                <text class="empty-text">还没有加入任何群组</text>
            </view>

            <!-- 群组列表 -->
            <view v-else class="group-items">
                <view
                    v-for="group in groups"
                    :key="group.id"
                    class="group-item"
                    @tap="navigateToGroup(group)"
                >
                    <image class="avatar" :src="group.avatar || defaultGroupAvatar" mode="aspectFill" />
                    <view class="info">
                        <view class="name-row">
                            <text class="name">{{ group.name }}</text>
                            <view class="role-tag" v-if="group.owner === userStore.userInfo?.userid">群主</view>
                        </view>
                        <view class="desc-row">
                            <text class="member-count">{{ group.memberCount }}人</text>
                            <text class="description">{{ group.description || '暂无群介绍' }}</text>
                        </view>
                    </view>
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

        <!-- 创建群组弹窗 -->
        <uni-popup ref="createPopup" type="center">
            <view class="create-popup">
                <view class="popup-header">
                    <text class="title">创建群组</text>
                    <text class="close" @tap="closeCreatePopup">×</text>
                </view>
                <view class="popup-content">
                    <view class="form-item">
                        <text class="label">群组名称</text>
                        <input
                            v-model="createForm.name"
                            class="input"
                            type="text"
                            placeholder="请输入群组名称"
                            maxlength="20"
                        />
                    </view>
                    <view class="form-item">
                        <text class="label">群组描述</text>
                        <textarea
                            v-model="createForm.description"
                            class="textarea"
                            placeholder="请输入群组描述"
                            maxlength="100"
                        />
                        <text class="word-count">{{ createForm.description.length }}/100</text>
                    </view>
                    <view class="form-item">
                        <text class="label">加群方式</text>
                        <picker
                            :range="joinModeOptions"
                            range-key="label"
                            :value="createForm.joinMode"
                            @change="handleJoinModeChange"
                        >
                            <view class="picker">
                                {{ joinModeOptions[createForm.joinMode].label }}
                                <text class="iconfont icon-right"></text>
                            </view>
                        </picker>
                    </view>
                </view>
                <view class="popup-footer">
                    <button class="cancel-btn" @tap="closeCreatePopup">取消</button>
                    <button 
                        class="confirm-btn" 
                        :disabled="!isFormValid"
                        @tap="submitCreateGroup"
                    >
                        创建
                    </button>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import type { GroupInfo } from '@/types/group';

const userStore = useUserStore();
const defaultGroupAvatar = '/static/images/avatar/group.png';

// 搜索文本
const searchText = ref('');
// 群组列表
const groups = ref<GroupInfo[]>([]);
// 是否正在刷新
const isRefreshing = ref(false);
// 是否正在加载更多
const isLoading = ref(false);
// 是否还有更多数据
const hasMore = ref(true);
// 创建群组弹窗引用
const createPopup = ref();

// 加群方式选项
const joinModeOptions = [
    { value: 0, label: '自由加入' },
    { value: 1, label: '需要验证' },
    { value: 2, label: '禁止加入' }
];

// 创建群组表单
const createForm = ref({
    name: '',
    description: '',
    joinMode: 0
});

// 表单验证
const isFormValid = computed(() => {
    return createForm.value.name.trim().length > 0;
});

/**
 * 处理搜索
 */
const handleSearch = async () => {
    if (!searchText.value.trim()) {
        return;
    }
    try {
        uni.showLoading({ title: '搜索中...' });
        // TODO: 通过 WebSocket 发送搜索请求到 Flamingo 服务器
        // const response = await searchGroups(searchText.value);
        // groups.value = response.data;
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
        // TODO: 通过 WebSocket 获取群组列表
        // const response = await getGroups();
        // groups.value = response.data;
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
        // TODO: 通过 WebSocket 获取更多群组
        // const response = await getMoreGroups();
        // groups.value.push(...response.data);
        // hasMore.value = response.hasMore;
    } finally {
        isLoading.value = false;
    }
};

/**
 * 处理创建群组
 */
const handleCreateGroup = () => {
    createForm.value = {
        name: '',
        description: '',
        joinMode: 0
    };
    createPopup.value.open();
};

/**
 * 处理加群方式变更
 */
const handleJoinModeChange = (e: any) => {
    createForm.value.joinMode = parseInt(e.detail.value);
};

/**
 * 关闭创建群组弹窗
 */
const closeCreatePopup = () => {
    createPopup.value.close();
};

/**
 * 提交创建群组
 */
const submitCreateGroup = async () => {
    if (!isFormValid.value) return;

    try {
        uni.showLoading({ title: '创建中...' });
        // TODO: 通过 WebSocket 发送创建群组请求到 Flamingo 服务器
        // const response = await createGroup(createForm.value);
        
        uni.showToast({
            title: '创建成功',
            icon: 'success'
        });
        closeCreatePopup();
        handleRefresh();
    } catch (error) {
        console.error('创建群组失败:', error);
        uni.showToast({
            title: '创建失败',
            icon: 'none'
        });
    } finally {
        uni.hideLoading();
    }
};

/**
 * 导航到群组详情
 */
const navigateToGroup = (group: GroupInfo) => {
    uni.navigateTo({
        url: `/pages/group/detail?id=${group.id}`
    });
};

// 页面加载时获取群组列表
onMounted(() => {
    handleRefresh();
});
</script>

<style lang="scss">
.groups-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 20rpx;

    .search-box {
        height: 80rpx;
        background-color: #fff;
        border-radius: 40rpx;
        display: flex;
        align-items: center;
        padding: 0 30rpx;
        margin-bottom: 20rpx;

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

    .create-group {
        height: 100rpx;
        background-color: #fff;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        padding: 0 30rpx;
        margin-bottom: 20rpx;

        .icon-add-group {
            font-size: 40rpx;
            color: #6c5ce7;
            margin-right: 20rpx;
        }

        .text {
            font-size: 32rpx;
            color: #2d3436;
        }
    }

    .group-list {
        height: calc(100vh - 240rpx);

        .empty-state {
            padding: 100rpx 0;
            display: flex;
            flex-direction: column;
            align-items: center;

            .empty-icon {
                width: 200rpx;
                height: 200rpx;
                margin-bottom: 30rpx;
            }

            .empty-text {
                font-size: 28rpx;
                color: #8a8a8a;
            }
        }

        .group-items {
            .group-item {
                background-color: #fff;
                border-radius: 20rpx;
                padding: 20rpx;
                margin-bottom: 20rpx;
                display: flex;
                align-items: center;

                .avatar {
                    width: 100rpx;
                    height: 100rpx;
                    border-radius: 20rpx;
                    margin-right: 20rpx;
                }

                .info {
                    flex: 1;

                    .name-row {
                        display: flex;
                        align-items: center;
                        margin-bottom: 10rpx;

                        .name {
                            font-size: 32rpx;
                            color: #2d3436;
                            margin-right: 16rpx;
                        }

                        .role-tag {
                            padding: 4rpx 12rpx;
                            background-color: #6c5ce7;
                            border-radius: 8rpx;
                            font-size: 24rpx;
                            color: #fff;
                        }
                    }

                    .desc-row {
                        font-size: 26rpx;
                        color: #636e72;

                        .member-count {
                            margin-right: 16rpx;
                        }

                        .description {
                            @include text-ellipsis;
                        }
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

    .create-popup {
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

            .form-item {
                margin-bottom: 30rpx;
                position: relative;

                &:last-child {
                    margin-bottom: 0;
                }

                .label {
                    font-size: 28rpx;
                    color: #8a8a8a;
                    margin-bottom: 16rpx;
                    display: block;
                }

                .input {
                    width: 100%;
                    height: 80rpx;
                    background-color: #f5f6fa;
                    border-radius: 12rpx;
                    padding: 0 20rpx;
                    font-size: 28rpx;
                }

                .textarea {
                    width: 100%;
                    height: 160rpx;
                    background-color: #f5f6fa;
                    border-radius: 12rpx;
                    padding: 20rpx;
                    font-size: 28rpx;
                }

                .word-count {
                    position: absolute;
                    right: 20rpx;
                    bottom: 20rpx;
                    font-size: 24rpx;
                    color: #8a8a8a;
                }

                .picker {
                    width: 100%;
                    height: 80rpx;
                    background-color: #f5f6fa;
                    border-radius: 12rpx;
                    padding: 0 20rpx;
                    font-size: 28rpx;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    .icon-right {
                        font-size: 36rpx;
                        color: #8a8a8a;
                    }
                }
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

                    &:disabled {
                        opacity: 0.7;
                    }
                }
            }
        }
    }
}
</style> 