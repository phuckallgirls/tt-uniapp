<template>
  <view class="group-detail">
    <!-- 基本信息区域 -->
    <view class="info-section">
      <view class="avatar-box" @tap="changeGroupAvatar" v-if="canModifyGroupInfo">
        <image :src="groupInfo.avatar" class="avatar" />
        <text class="change-text">更换群头像</text>
      </view>
      <image v-else :src="groupInfo.avatar" class="avatar" />
      
      <view class="group-name" @tap="showNameEdit" v-if="canModifyGroupInfo">
        <text>{{ groupInfo.name }}</text>
        <text class="iconfont icon-edit"></text>
      </view>
      <text v-else class="group-name">{{ groupInfo.name }}</text>
      
      <text class="group-id">群号：{{ groupInfo.id }}</text>
    </view>

    <!-- 群公告区域 -->
    <view class="announcement-section" @tap="showAnnouncementEdit" v-if="canModifyGroupInfo">
      <view class="section-title">群公告</view>
      <view class="announcement-content">
        {{ groupInfo.announcement || '暂无群公告，点击编辑' }}
      </view>
    </view>
    <view class="announcement-section" v-else>
      <view class="section-title">群公告</view>
      <view class="announcement-content">
        {{ groupInfo.announcement || '暂无群公告' }}
      </view>
    </view>

    <!-- 群成员区域 -->
    <view class="members-section" @tap="navigateToMembers">
      <view class="section-title">群成员</view>
      <view class="members-preview">
        <view class="member-count">
          共{{ groupInfo.memberCount }}人
        </view>
        <view class="members-avatars">
          <image 
            v-for="member in previewMembers" 
            :key="member.userId"
            :src="member.avatar"
            class="member-avatar"
          />
        </view>
        <text class="iconfont icon-right"></text>
      </view>
    </view>

    <!-- 群设置区域 -->
    <view class="settings-section">
      <view class="setting-item">
        <text>消息免打扰</text>
        <switch 
          :checked="isNoDisturb" 
          @change="toggleNoDisturb" 
          color="#07c160"
        />
      </view>
      <view class="setting-item">
        <text>置顶聊天</text>
        <switch 
          :checked="isTop" 
          @change="toggleTop" 
          color="#07c160"
        />
      </view>
      <view class="setting-item" @tap="clearHistory">
        <text>清空聊天记录</text>
        <text class="iconfont icon-right"></text>
      </view>
    </view>

    <!-- 退出群聊按钮 -->
    <view class="quit-section">
      <button 
        class="quit-btn"
        :class="{ 'dismiss': isOwner }"
        @tap="quitGroup"
      >
        {{ isOwner ? '解散群聊' : '退出群聊' }}
      </button>
    </view>

    <!-- 群名称编辑弹窗 -->
    <uni-popup ref="namePopup" type="dialog">
      <uni-popup-dialog
        title="修改群名称"
        :value="newGroupName"
        placeholder="请输入新的群名称"
        @confirm="confirmNameChange"
      />
    </uni-popup>

    <!-- 群公告编辑弹窗 -->
    <uni-popup ref="announcementPopup" type="dialog">
      <uni-popup-dialog
        title="修改群公告"
        :value="newAnnouncement"
        type="textarea"
        placeholder="请输入群公告"
        @confirm="confirmAnnouncementChange"
      />
    </uni-popup>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { GroupInfo, GroupMember } from '../../types/group'
import { request } from '../../utils/request'
import { useUserStore } from '../../stores/user'
import { useChatStore } from '../../stores/chat'

export default defineComponent({
  name: 'GroupDetail',

  data() {
    return {
      groupInfo: {
        id: '',
        name: '',
        avatar: '',
        memberCount: 0,
        maxMemberCount: 500,
        createTime: 0,
        owner: '',
        admins: [],
        memberList: [],
        announcement: ''
      } as GroupInfo,
      currentUserId: '',
      isNoDisturb: false,
      isTop: false,
      newGroupName: '',
      newAnnouncement: '',
      previewMembers: [] as GroupMember[]
    }
  },

  computed: {
    isOwner(): boolean {
      return this.currentUserId === this.groupInfo.owner
    },

    isAdmin(): boolean {
      return this.groupInfo.admins.includes(this.currentUserId)
    },

    canModifyGroupInfo(): boolean {
      return this.isOwner || this.isAdmin
    }
  },

  methods: {
    async loadGroupInfo() {
      try {
        const response = await request({
          url: `/api/group/${this.groupInfo.id}`,
          method: 'GET'
        })
        
        if (response.code === 0 && response.data) {
          this.groupInfo = response.data
          // 获取预览成员（最多显示4个）
          this.previewMembers = this.groupInfo.memberList.slice(0, 4)
        } else {
          throw new Error(response.message || '获取群信息失败')
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '加载群信息失败',
          icon: 'none'
        })
      }
    },

    async changeGroupAvatar() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })
        
        const tempFilePath = res.tempFilePaths[0]
        
        // 上传图片
        const uploadRes = await uni.uploadFile({
          url: '/api/upload',
          filePath: tempFilePath,
          name: 'file'
        })
        
        const data = JSON.parse(uploadRes.data)
        if (data.code === 0 && data.data) {
          // 更新群头像
          const response = await request({
            url: `/api/group/${this.groupInfo.id}`,
            method: 'PUT',
            data: {
              avatar: data.data.url
            }
          })
          
          if (response.code === 0) {
            await this.loadGroupInfo()
            uni.showToast({
              title: '更新成功',
              icon: 'success'
            })
          } else {
            throw new Error(response.message || '更新失败')
          }
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '更换头像失败',
          icon: 'none'
        })
      }
    },

    showNameEdit() {
      this.newGroupName = this.groupInfo.name
      this.$refs.namePopup.open()
    },

    async confirmNameChange(value: string) {
      if (!value.trim()) {
        uni.showToast({
          title: '群名称不能为空',
          icon: 'none'
        })
        return
      }

      try {
        const response = await request({
          url: `/api/group/${this.groupInfo.id}`,
          method: 'PUT',
          data: {
            name: value.trim()
          }
        })
        
        if (response.code === 0) {
          await this.loadGroupInfo()
          uni.showToast({
            title: '修改成功',
            icon: 'success'
          })
        } else {
          throw new Error(response.message || '修改失败')
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '修改群名称失败',
          icon: 'none'
        })
      }
    },

    showAnnouncementEdit() {
      this.newAnnouncement = this.groupInfo.announcement
      this.$refs.announcementPopup.open()
    },

    async confirmAnnouncementChange(value: string) {
      try {
        const response = await request({
          url: `/api/group/${this.groupInfo.id}`,
          method: 'PUT',
          data: {
            announcement: value.trim()
          }
        })
        
        if (response.code === 0) {
          await this.loadGroupInfo()
          uni.showToast({
            title: '修改成功',
            icon: 'success'
          })
        } else {
          throw new Error(response.message || '修改失败')
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '修改群公告失败',
          icon: 'none'
        })
      }
    },

    navigateToMembers() {
      uni.navigateTo({
        url: `/pages/group/members?groupId=${this.groupInfo.id}`
      })
    },

    async toggleNoDisturb(e: any) {
      const value = e.detail.value
      try {
        const chatStore = useChatStore()
        await chatStore.updateSessionSetting(this.groupInfo.id, {
          noDisturb: value
        })
        this.isNoDisturb = value
      } catch (e) {
        uni.showToast({
          title: '设置失败',
          icon: 'none'
        })
        // 还原开关状态
        this.isNoDisturb = !value
      }
    },

    async toggleTop(e: any) {
      const value = e.detail.value
      try {
        const chatStore = useChatStore()
        await chatStore.updateSessionSetting(this.groupInfo.id, {
          isTop: value
        })
        this.isTop = value
      } catch (e) {
        uni.showToast({
          title: '设置失败',
          icon: 'none'
        })
        // 还原开关状态
        this.isTop = !value
      }
    },

    async clearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定要清空聊天记录吗？',
        async success: (res) => {
          if (res.confirm) {
            try {
              const chatStore = useChatStore()
              await chatStore.clearMessages(this.groupInfo.id)
              uni.showToast({
                title: '已清空',
                icon: 'success'
              })
            } catch (e) {
              uni.showToast({
                title: '清空失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },

    async quitGroup() {
      const action = this.isOwner ? '解散' : '退出'
      uni.showModal({
        title: '提示',
        content: `确定要${action}该群聊吗？`,
        async success: (res) => {
          if (res.confirm) {
            try {
              const response = await request({
                url: `/api/group/${this.groupInfo.id}/${this.isOwner ? 'dismiss' : 'quit'}`,
                method: 'POST'
              })
              
              if (response.code === 0) {
                const chatStore = useChatStore()
                await chatStore.removeSession(this.groupInfo.id)
                
                uni.showToast({
                  title: `${action}成功`,
                  icon: 'success'
                })
                
                setTimeout(() => {
                  uni.switchTab({
                    url: '/pages/chats/index'
                  })
                }, 1500)
              } else {
                throw new Error(response.message || `${action}失败`)
              }
            } catch (e) {
              uni.showToast({
                title: e.message || `${action}失败`,
                icon: 'none'
              })
            }
          }
        }
      })
    }
  },

  async onLoad(options: any) {
    const userStore = useUserStore()
    this.currentUserId = userStore.userInfo.id
    this.groupInfo.id = options.groupId
    
    // 加载群设置
    const chatStore = useChatStore()
    const session = chatStore.sessions.find(s => s.id === this.groupInfo.id)
    if (session) {
      this.isNoDisturb = session.noDisturb || false
      this.isTop = session.isTop || false
    }
    
    await this.loadGroupInfo()
  }
})
</script>

<style lang="scss">
.group-detail {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;

  .info-section {
    background: #fff;
    padding: 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20rpx;

    .avatar-box {
      position: relative;
      margin-bottom: 20rpx;

      .avatar {
        width: 160rpx;
        height: 160rpx;
        border-radius: 20rpx;
      }

      .change-text {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 24rpx;
        text-align: center;
        padding: 8rpx 0;
        border-bottom-left-radius: 20rpx;
        border-bottom-right-radius: 20rpx;
      }
    }

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 20rpx;
      margin-bottom: 20rpx;
    }

    .group-name {
      font-size: 36rpx;
      font-weight: 500;
      margin-bottom: 10rpx;
      display: flex;
      align-items: center;

      .icon-edit {
        font-size: 32rpx;
        color: #999;
        margin-left: 10rpx;
      }
    }

    .group-id {
      font-size: 28rpx;
      color: #999;
    }
  }

  .announcement-section,
  .members-section,
  .settings-section {
    background: #fff;
    margin-bottom: 20rpx;
    padding: 0 30rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 500;
      padding: 30rpx 0;
      border-bottom: 1rpx solid #eee;
    }
  }

  .announcement-section {
    .announcement-content {
      padding: 30rpx 0;
      font-size: 28rpx;
      color: #666;
      line-height: 1.6;
    }
  }

  .members-section {
    .members-preview {
      padding: 30rpx 0;
      display: flex;
      align-items: center;

      .member-count {
        font-size: 28rpx;
        color: #666;
        margin-right: 20rpx;
      }

      .members-avatars {
        flex: 1;
        display: flex;
        
        .member-avatar {
          width: 80rpx;
          height: 80rpx;
          border-radius: 10rpx;
          margin-right: 20rpx;
        }
      }

      .icon-right {
        font-size: 32rpx;
        color: #999;
      }
    }
  }

  .settings-section {
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx 0;
      font-size: 32rpx;
      border-bottom: 1rpx solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .icon-right {
        font-size: 32rpx;
        color: #999;
      }
    }
  }

  .quit-section {
    padding: 40rpx 30rpx;

    .quit-btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      text-align: center;
      background: #ff4d4f;
      color: #fff;
      font-size: 32rpx;
      border-radius: 10rpx;

      &.dismiss {
        background: #ff4d4f;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}
</style>
