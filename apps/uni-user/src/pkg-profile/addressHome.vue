<script setup>
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useAddressDisplay } from '@/composables/features/address'
import { ROUTES, withQuery } from '@/config/routes'
import { showConfirm } from '@/platform/feedback'
import { navigateTo } from '@/platform/navigation'
import { useAddressStore } from '@/stores/modules/store-address'

const addressStore = useAddressStore()
const { AddressList } = storeToRefs(addressStore)
const { loadAddresses, romeAddress, markDefault } = addressStore
const { displayAddresses, getAddressTitle, getContactName, getContactGender, getContactPhone } = useAddressDisplay(AddressList)
// 确认框和请求结束前，不允许叠加删除或默认操作。
const busyId = ref(null)
const operationError = ref('')

function goAddAddress() {
  if (busyId.value === null)
    navigateTo(ROUTES.ADDRESS_ADD)
}
function goEditAddress(item) {
  if (busyId.value === null)
    navigateTo(withQuery(ROUTES.ADDRESS_ADD, { id: String(item.id) }))
}
async function handleDelete(item) {
  if (busyId.value !== null)
    return
  busyId.value = item.id
  operationError.value = ''
  try {
    const confirmed = await showConfirm({
      title: '删除地址',
      content: '确定删除该收货地址吗？',
      confirmText: '删除',
    })
    if (confirmed && !await romeAddress(item.id))
      operationError.value = '删除失败，地址已保留，请重试'
  }
  finally {
    busyId.value = null
  }
}
async function handleDefault(item) {
  if (busyId.value !== null || item.isDefault)
    return
  busyId.value = item.id
  operationError.value = ''
  try {
    await markDefault(item.id)
  }
  catch (error) {
    operationError.value = error?.message || '设置默认失败，请重试'
  }
  finally {
    busyId.value = null
  }
}

// 共享action会记住第一次页面的回调包装；旧页销毁后就不再刷新。
// 每次创建页面都给它一个新回调，不能直接传loadAddresses。
onShow(() => loadAddresses())
</script>

<template>
  <view class="address-page">
    <view v-if="operationError" class="operation-error">
      {{ operationError }}
    </view>
    <view v-if="!displayAddresses.length" class="empty-state">
      <text>暂无收货地址</text>
      <text class="empty-hint">
        点击下方按钮新增地址
      </text>
    </view>
    <view v-else class="address-list">
      <view v-for="item in displayAddresses" :key="item.id" class="address-item">
        <view class="address-info">
          <view class="address-tags">
            <text v-if="item.isDefault" class="default-badge">
              默认
            </text>
            <text v-if="item.tag" class="address-info_tag">
              {{ item.tag }}
            </text>
          </view>
          <text class="address-info_title">
            {{ getAddressTitle(item) }}
          </text>
          <view class="address-info_meta">
            <text>{{ getContactName(item) }}</text>
            <text>{{ getContactGender(item) }}</text>
            <text>{{ getContactPhone(item) }}</text>
          </view>
        </view>
        <view class="address-item_actions" :class="{ 'actions-busy': busyId !== null }">
          <view class="action-line">
            <view class="edit-button" @click="goEditAddress(item)">
              编辑
            </view>
            <view class="delete-button" @click="handleDelete(item)">
              删除
            </view>
          </view>
          <view v-if="!item.isDefault" class="default-button" @click="handleDefault(item)">
            设为默认
          </view>
        </view>
      </view>
    </view>
    <view class="add-address-bar" @click="goAddAddress">
      + 新增地址
    </view>
  </view>
</template>

<style lang="scss" scoped>
.address-page {
  min-height: 100%;
  color: #222;
  background: #fff;
}

.address-list {
  padding: 28rpx 36rpx 0;
  margin-bottom: 160rpx;
}

.address-item {
  display: flex;
  align-items: center;
  min-height: 182rpx;
  border-bottom: 2rpx solid #e9e9e9;
}

.address-info {
  flex: 1;
  min-width: 0;

  &_tag {
    font-size: 24rpx;
    color: #1890ff;
  }

  &_title {
    @include text-ellipsis;

    display: block;
    margin-bottom: 24rpx;
    font-size: 36rpx;
    font-weight: 500;
    line-height: 1.25;
  }

  &_meta {
    display: flex;
    gap: 24rpx;
    font-size: 26rpx;
    line-height: 1.2;
    color: #999;
  }
}

.address-tags {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin-bottom: 12rpx;
}

.default-badge {
  padding: 2rpx 8rpx;
  font-size: 22rpx;
  color: #1890ff;
  background: #e6f7ff;
  border-radius: 4rpx;
}

.address-item_actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-left: 20rpx;
  font-size: 24rpx;
}

.action-line {
  display: flex;
  gap: 24rpx;
}

.edit-button {
  color: #999;
}

.delete-button {
  color: #ff4d4f;
}

.default-button {
  color: #1890ff;
}

.actions-busy {
  opacity: 0.5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 120rpx 32rpx;
  color: #999;
  text-align: center;
}

.empty-hint {
  font-size: 26rpx;
}

.operation-error {
  padding: 20rpx 32rpx;
  font-size: 26rpx;
  color: #ff4d4f;
}

.add-address-bar {
  position: fixed;
  right: 48rpx;
  bottom: 48rpx;
  left: 48rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #fff;
  text-align: center;
  background: #1890ff;
  border-radius: 80rpx;
  box-shadow: 0 4rpx 20rpx #1890ff40;
}
</style>
