<template>
    <view class="contacts-container">
        <!-- 搜索栏 -->
        <view class="search-box">
            <view class="search-bar">
                <text class="iconfont icon-search"></text>
                <input
                    v-model="searchText"
                    class="search-input"
                    type="text"
                    placeholder="搜索联系人"
                    confirm-type="search"
                    @confirm="handleSearch"
                />
            </view>
        </view>

        <!-- 功能入口 -->
        <view class="feature-list">
            <view class="feature-item" @tap="handleNewFriends">
                <view class="icon-box new-friends">
                    <text class="iconfont icon-add-friend"></text>
                </view>
                <text class="name">新的朋友</text>
                <view v-if="newFriendsCount > 0" class="badge">{{ newFriendsCount }}</view>
            </view>
            <view class="feature-item" @tap="handleGroups">
                <view class="icon-box groups">
                    <text class="iconfont icon-group"></text>
                </view>
                <text class="name">我的群组</text>
            </view>
        </view>

        <!-- 联系人列表 -->
        <scroll-view
            class="contact-list"
            scroll-y
            :scroll-into-view="currentLetter"
            @scroll="handleScroll"
        >
            <!-- 分组列表 -->
            <block v-for="group in groupedContacts" :key="group.letter">
                <!-- 分组标题 -->
                <view :id="'letter-' + group.letter" class="group-title">
                    {{ group.letter }}
                </view>
                
                <!-- 分组内容 -->
                <view
                    v-for="contact in group.contacts"
                    :key="contact.userid"
                    class="contact-item"
                    hover-class="contact-item-hover"
                    @tap="handleContactTap(contact)"
                >
                    <image class="avatar" :src="contact.avatar" mode="aspectFill" />
                    <view class="info">
                        <text class="name">{{ contact.remarkName || contact.nickname }}</text>
                        <text v-if="contact.signature" class="signature">{{ contact.signature }}</text>
                    </view>
                    <view v-if="contact.online" class="online-status" />
                </view>
            </block>
        </scroll-view>

        <!-- 字母索引 -->
        <view
            class="letter-index"
            @touchstart="handleLetterTouchStart"
            @touchmove="handleLetterTouchMove"
            @touchend="handleLetterTouchEnd"
        >
            <text
                v-for="letter in letters"
                :key="letter"
                class="letter"
                :class="{ active: currentLetter === 'letter-' + letter }"
            >
                {{ letter }}
            </text>
        </view>

        <!-- 字母提示 -->
        <view v-if="showLetterHint" class="letter-hint">
            {{ currentLetter?.replace('letter-', '') }}
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Contact, ContactGroup } from '@/types/contact';
import { onLoad, onPullDownRefresh, onUnload } from '@dcloudio/uni-app';  // 添加这行

// 搜索文本
const searchText = ref('');
// 当前选中的字母
const currentLetter = ref('');
// 是否显示字母提示
const showLetterHint = ref(false);
// 新朋友数量
const newFriendsCount = ref(3);

// 字母表
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

// 模拟联系人数据
const contacts = ref<Contact[]>([
    {
        userid: 1,
        username: 'zhangsan',
        nickname: '张三',
        avatar: '/static/images/avatar/1.png',
        signature: '这是一个签名',
        gender: 1,
        online: true,
        letter: 'Z'
    },
    {
        userid: 2,
        username: 'lisi',
        nickname: '李四',
        avatar: '/static/images/avatar/2.png',
        gender: 1,
        online: false,
        letter: 'L'
    },
    {
        userid: 3,
        username: 'wangwu',
        nickname: '王五',
        avatar: '/static/images/avatar/3.png',
        signature: '努力工作',
        gender: 1,
        online: true,
        letter: 'W'
    }
]);

// 按字母分组的联系人
const groupedContacts = computed(() => {
    const groups: { letter: string; contacts: Contact[] }[] = [];
    
    // 按字母分组
    letters.forEach(letter => {
        const letterContacts = contacts.value.filter(contact => contact.letter === letter);
        if (letterContacts.length > 0) {
            groups.push({
                letter,
                contacts: letterContacts.sort((a, b) => a.nickname.localeCompare(b.nickname))
            });
        }
    });
    
    return groups;
});

/**
 * 处理搜索
 */
const handleSearch = () => {
    if (!searchText.value.trim()) {
        return;
    }
    // TODO: 实现搜索逻辑
    console.log('搜索:', searchText.value);
};

/**
 * 处理新朋友点击
 */
const handleNewFriends = () => {
    uni.navigateTo({
        url: '/pages/contacts/new-friends'
    });
};

/**
 * 处理群组点击
 */
const handleGroups = () => {
    uni.navigateTo({
        url: '/pages/contacts/groups'
    });
};

/**
 * 处理联系人点击
 */
const handleContactTap = (contact: Contact) => {
    uni.navigateTo({
        url: `/pages/contacts/detail?userid=${contact.userid}`
    });
};

/**
 * 处理字母索引触摸开始
 */
const handleLetterTouchStart = (e: any) => {
    const touch = e.touches[0];
    showLetterHint.value = true;
    const letter = getLetterFromTouch(touch);
    if (letter) {
        currentLetter.value = `letter-${letter}`;
    }
};

/**
 * 处理字母索引触摸移动
 */
const handleLetterTouchMove = (e: any) => {
    const touch = e.touches[0];
    const letter = getLetterFromTouch(touch);
    if (letter && currentLetter.value !== `letter-${letter}`) {
        currentLetter.value = `letter-${letter}`;
    }
};

/**
 * 处理字母索引触摸结束
 */
const handleLetterTouchEnd = () => {
    showLetterHint.value = false;
};

/**
 * 从触摸位置获取对应的字母
 */
const getLetterFromTouch = (touch: any) => {
    // 获取字母索引列表的位置信息
    const letterIndex = uni.createSelectorQuery().select('.letter-index');
    letterIndex.boundingClientRect((rect: any) => {
        if (!rect) return null;
        
        const letterHeight = rect.height / letters.length;
        const offsetY = touch.clientY - rect.top;
        const index = Math.floor(offsetY / letterHeight);
        
        if (index >= 0 && index < letters.length) {
            return letters[index];
        }
    }).exec();
    
    return null;
};

/**
 * 处理滚动
 */
const handleScroll = (e: any) => {
    // TODO: 实现滚动时更新当前字母
};

/**
 * 生命周期
 */
onLoad(() => {
    // 初始化联系人数据
    loadContacts();
});

/**
 * 加载联系人数据
 */
const loadContacts = async () => {
    try {
        // TODO: 从服务器获取联系人列表
        // const response = await getContacts();
        // contacts.value = response.data;
    } catch (error) {
        console.error('加载联系人失败:', error);
        uni.showToast({
            title: '加载联系人失败',
            icon: 'none'
        });
    }
};

onPullDownRefresh(() => {
    loadContacts().finally(() => {
        uni.stopPullDownRefresh();
    });
});

onUnload(() => {
    // 清理工作
});
</script>

<style lang="scss">
.contacts-container {
    height: 100vh;
    background-color: #f8f9fa;
    position: relative;

    .search-box {
        padding: 20rpx 30rpx;
        background-color: #fff;

        .search-bar {
            height: 72rpx;
            background-color: #f5f6fa;
            border-radius: 36rpx;
            display: flex;
            align-items: center;
            padding: 0 30rpx;

            .icon-search {
                font-size: 32rpx;
                color: #8a8a8a;
                margin-right: 20rpx;
            }

            .search-input {
                flex: 1;
                height: 100%;
                font-size: 28rpx;
            }
        }
    }

    .feature-list {
        background-color: #fff;
        margin-top: 20rpx;

        .feature-item {
            display: flex;
            align-items: center;
            padding: 30rpx;
            position: relative;

            .icon-box {
                width: 80rpx;
                height: 80rpx;
                border-radius: 20rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 20rpx;

                &.new-friends {
                    background: linear-gradient(45deg, #6c5ce7, #a363d9);
                }

                &.groups {
                    background: linear-gradient(45deg, #00b894, #00cec9);
                }

                .iconfont {
                    color: #fff;
                    font-size: 40rpx;
                }
            }

            .name {
                font-size: 32rpx;
                color: #2d3436;
            }

            .badge {
                position: absolute;
                right: 30rpx;
                min-width: 36rpx;
                height: 36rpx;
                padding: 0 10rpx;
                background-color: #ff3b30;
                border-radius: 18rpx;
                color: #fff;
                font-size: 24rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    .contact-list {
        height: calc(100vh - 300rpx);

        .group-title {
            padding: 16rpx 30rpx;
            background-color: #f8f9fa;
            font-size: 24rpx;
            color: #8a8a8a;
        }

        .contact-item {
            display: flex;
            align-items: center;
            padding: 20rpx 30rpx;
            background-color: #fff;
            position: relative;

            &-hover {
                background-color: #f8f9fa;
            }

            .avatar {
                width: 80rpx;
                height: 80rpx;
                border-radius: 20rpx;
                margin-right: 20rpx;
            }

            .info {
                flex: 1;

                .name {
                    font-size: 32rpx;
                    color: #2d3436;
                }

                .signature {
                    font-size: 24rpx;
                    color: #8a8a8a;
                    margin-top: 4rpx;
                }
            }

            .online-status {
                width: 16rpx;
                height: 16rpx;
                border-radius: 50%;
                background-color: #4cd964;
                margin-left: 20rpx;
            }
        }
    }

    .letter-index {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        padding: 20rpx 10rpx;
        background-color: rgba(0, 0, 0, 0.3);
        border-radius: 30rpx;
        margin-right: 10rpx;

        .letter {
            font-size: 24rpx;
            color: #fff;
            padding: 4rpx 10rpx;
            
            &.active {
                color: #6c5ce7;
                font-weight: bold;
            }
        }
    }

    .letter-hint {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 160rpx;
        height: 160rpx;
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 80rpx;
        color: #fff;
        font-weight: bold;
    }
}
</style> 