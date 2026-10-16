<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/addressHome.vue 同源改造。
 * 整体替换占位页（Batch 3 profile 组）。
 *
 * 差异：
 * 1. `router.push('/profile/address/add')` → `navigateTo(ROUTES.ADDRESS_ADD)`；
 *    带 query 的编辑跳转 → `navigateTo(withQuery(ROUTES.ADDRESS_ADD, { id }))`
 *    （uni-app 的 navigateTo url 直接拼 `?id=` 即可，withQuery 收口处理拼接）
 * 2. `head-top` 组件：uni-user 里实际文件是 `src/components/header/head.vue`
 *    （easycom autoscan 只认 `components/HeadTop/HeadTop.vue` 这种同名结构，
 *    见 007 坑 15）→ **显式 import**（顺带接入 head.vue，解决 HANDOFF 任务 A3
 *    「head.vue 零引用」问题，addressHome 第一个接进它）
 * 3. `loadAddresses()` 的调用时机：web-user 是 setup 顶层直接调（等价 onMounted），
 *    uni-app 里 onShow 更合适——本页在列表页/添加页间来回跳时，每次回到列表
 *    都应刷新（新增/编辑过地址）。改用 `onShow(loadAddresses)`。
 *    ⚠️ 本页是 tabBar 页的入口之一（从 profile → 账户信息 → 收货地址），
 *    非 tabBar 页，navigateTo 拦截器的鉴权兜底已经覆盖，不需要再写 onShow 鉴权。
 * 4. `van-icon name="edit"` → 小程序端没有 vant，改用文字按钮「编辑」（语义等价，
 *    视觉降级接受；后续若要保留图标可用 SvgIcon + 现成 iconfont 里查有没有 edit 图标）
 * 5. px → rpx
 */
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'

import Head from '@/components/header/head.vue'
import { useAddressDisplay } from '@/composables/features/address'
import { ROUTES, withQuery } from '@/config/routes'
import { navigateTo } from '@/platform/navigation'
import { useAddressStore } from '@/stores/modules/store-address'

const addressStore = useAddressStore()
const { AddressList } = storeToRefs(addressStore)
const { loadAddresses } = addressStore
const {
  displayAddresses,
  getAddressTitle,
  getContactName,
  getContactGender,
  getContactPhone,
} = useAddressDisplay(AddressList)

function goAddAddress() {
  navigateTo(ROUTES.ADDRESS_ADD)
}

function goEditAddress(item) {
  navigateTo(withQuery(ROUTES.ADDRESS_ADD, { id: String(item.id) }))
}

// 列表页每次进入都刷新（新增/编辑地址后回来要看到最新数据）
onShow(loadAddresses)
</script>

<template>
  <view class="address-page">
    <Head
      head-title="收货地址"
      theme="light"
      class="address-head"
    >
      <template #edit>
        <view class="add-button" @click="goAddAddress">
          新增地址
        </view>
      </template>
    </Head>

    <view class="address-list">
      <view v-for="item in displayAddresses" :key="item.id" class="address-item">
        <view class="address-info">
          <text class="address-info_title">
            {{ getAddressTitle(item) }}
          </text>
          <view class="address-info_meta">
            <text>{{ getContactName(item) }}</text>
            <text>{{ getContactGender(item) }}</text>
            <text>{{ getContactPhone(item) }}</text>
          </view>
        </view>
        <view class="edit-button" @click="goEditAddress(item)">
          编辑
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.address-page {
  min-height: 100%;
  color: #222;
  background: #fff;
}

.add-button {
  padding: 16rpx 0;
  font-size: 30rpx;
  color: #fff;
  white-space: nowrap;
}

.address-list {
  padding: 28rpx 36rpx 0;
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

  &_title {
    @include text-ellipsis;

    display: block;
    margin-bottom: 24rpx;
    font-size: 36rpx;
    font-weight: 500;
    line-height: 1.25;
    color: #222;
  }

  &_meta {
    display: flex;
    gap: 40rpx;
    font-size: 28rpx;
    line-height: 1.2;
    color: #999;
  }
}

.edit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  font-size: 24rpx;
  color: #888;
}
</style>
