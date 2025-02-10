<template>
  <view class="members-container">
    <!-- 搜索框 -->
    <view class="search-box">
      <input 
        v-model="searchKey" 
        type="text" 
        placeholder="搜索群成员" 
        @input="onSearch"
      />
    </view>

    <!-- 管理员区域 -->
    <view class="admin-section" v-if="isOwnerOrAdmin">
      <view class="section-title">管理员</view>
      <view class="member-list">
        <view 
          class="member-item" 
          v-for="member in adminMembers" 
          :key="member.userId"
        >
          <image :src="member.avatar" class="avatar" />
          <view class="info">
            <text class="nickname">{{ member.nickname }}</text>
            <text class="role">{{ member.userId === groupInfo.owner ? '群主' : '管理员' }}</text>
          </view>
          <view 
            class="action" 
            v-if="isOwner && member.userId !== groupInfo.owner"
          >
            <button @click="removeAdmin(member)">移除管理员</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 普通成员区域 -->
    <view class="member-section">
      <view class="section-title">
        成员 ({{ normalMembers.length }})
      </view>
      <view class="member-list">
        <view 
          class="member-item" 
          v-for="member in filteredMembers" 
          :key="member.userId"
        >
          <image :src="member.avatar" class="avatar" />
          <view class="info">
            <text class="nickname">{{ member.nickname }}</text>
            <text class="active-time">
              最后活跃: {{ formatTime(member.lastActiveTime) }}
            </text>
          </view>
          <view class="action" v-if="canManageMembers">
            <button 
              v-if="isOwner" 
              @click="setAdmin(member)"
            >设为管理员</button>
            <button 
              class="remove" 
              @click="removeMember(member)"
            >移除</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { GroupInfo, GroupMember, GroupPermission } from '../../types/group'
import { request } from '../../utils/request'
import { useUserStore } from '../../stores/user'

export default defineComponent({
  name: 'GroupMembers',
  
  data() {
    return {
      searchKey: '',
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
        announcement: '',
        lastActiveTime: 0
      } as GroupInfo,
      currentUserId: '',
      permission: {
        canManageMembers: false,
        canModifyGroupInfo: false,
        canRemoveMembers: false
      } as GroupPermission
    }
  },

  computed: {
    isOwner(): boolean {
      return this.currentUserId === this.groupInfo.owner
    },

    isOwnerOrAdmin(): boolean {
      return this.isOwner || this.groupInfo.admins.includes(this.currentUserId)
    },

    canManageMembers(): boolean {
      return this.permission.canManageMembers
    },

    adminMembers(): GroupMember[] {
      return this.groupInfo.memberList.filter(member => 
        member.role === 'admin' || member.userId === this.groupInfo.owner
      ).sort((a, b) => {
        // 群主始终排在第一位
        if (a.userId === this.groupInfo.owner) return -1
        if (b.userId === this.groupInfo.owner) return 1
        return b.lastActiveTime || 0 - (a.lastActiveTime || 0)
      })
    },

    normalMembers(): GroupMember[] {
      return this.groupInfo.memberList.filter(member => 
        member.role === 'member'
      ).sort((a, b) => (b.lastActiveTime || 0) - (a.lastActiveTime || 0))
    },

    filteredMembers(): GroupMember[] {
      if (!this.searchKey) return this.normalMembers
      const key = this.searchKey.toLowerCase()
      return this.normalMembers.filter(member =>
        member.nickname.toLowerCase().includes(key)
      )
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
          
          // 设置权限
          this.permission = {
            canManageMembers: this.isOwnerOrAdmin,
            canModifyGroupInfo: this.isOwnerOrAdmin,
            canRemoveMembers: this.isOwnerOrAdmin
          }
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

    formatTime(timestamp?: number): string {
      if (!timestamp) return '未知'
      const now = new Date()
      const date = new Date(timestamp)
      
      if (now.getDate() === date.getDate()) {
        return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      
      if (now.getDate() - date.getDate() === 1) {
        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    },

    async setAdmin(member: GroupMember) {
      try {
        const response = await request({
          url: `/api/group/${this.groupInfo.id}/admin`,
          method: 'POST',
          data: {
            userId: member.userId
          }
        })
        
        if (response.code === 0) {
          await this.loadGroupInfo()
          uni.showToast({
            title: '设置成功',
            icon: 'success'
          })
        } else {
          throw new Error(response.message || '设置失败')
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '设置失败',
          icon: 'none'
        })
      }
    },

    async removeAdmin(member: GroupMember) {
      try {
        const response = await request({
          url: `/api/group/${this.groupInfo.id}/admin/${member.userId}`,
          method: 'DELETE'
        })
        
        if (response.code === 0) {
          await this.loadGroupInfo()
          uni.showToast({
            title: '移除成功',
            icon: 'success'
          })
        } else {
          throw new Error(response.message || '移除失败')
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '移除失败',
          icon: 'none'
        })
      }
    },

    async removeMember(member: GroupMember) {
      try {
        const response = await request({
          url: `/api/group/${this.groupInfo.id}/member/${member.userId}`,
          method: 'DELETE'
        })
        
        if (response.code === 0) {
          await this.loadGroupInfo()
          uni.showToast({
            title: '移除成功',
            icon: 'success'
          })
        } else {
          throw new Error(response.message || '移除失败')
        }
      } catch (e) {
        uni.showToast({
          title: e.message || '移除失败',
          icon: 'none'
        })
      }
    },

    onSearch() {
      // 搜索是在前端进行的，不需要调用API
      // 通过 computed 属性 filteredMembers 自动处理
    }
  },

  async onLoad(options: any) {
    const userStore = useUserStore()
    this.currentUserId = userStore.userInfo.id
    this.groupInfo.id = options.groupId
    await this.loadGroupInfo()
  }
})
</script>

<style lang="scss">
.members-container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
  
  .search-box {
    padding: 20rpx;
    background: #fff;
    margin-bottom: 20rpx;
    border-radius: 10rpx;
    
    input {
      background: #f5f5f5;
      padding: 20rpx;
      border-radius: 10rpx;
      font-size: 28rpx;
      width: 100%;
      box-sizing: border-box;
    }
  }
  
  .section-title {
    font-size: 28rpx;
    color: #666;
    padding: 20rpx 0;
    font-weight: 500;
  }
  
  .member-list {
    background: #fff;
    border-radius: 10rpx;
    
    .member-item {
      display: flex;
      align-items: center;
      padding: 20rpx;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        background: #eee;
      }
      
      .info {
        flex: 1;
        
        .nickname {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
        
        .role, .active-time {
          font-size: 24rpx;
          color: #999;
          margin-top: 10rpx;
          display: block;
        }
        
        .role {
          color: #576b95;
        }
      }
      
      .action {
        display: flex;
        align-items: center;
        
        button {
          font-size: 24rpx;
          margin-left: 20rpx;
          padding: 10rpx 20rpx;
          background: #fff;
          border: 1rpx solid #ddd;
          border-radius: 8rpx;
          
          &.remove {
            color: #ff4d4f;
            border-color: #ff4d4f;
          }
          
          &:active {
            opacity: 0.7;
          }
        }
      }
    }
  }
}
</style>
