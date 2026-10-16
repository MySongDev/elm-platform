<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/payment/PaymentResult.vue 同源改造（支付结果页）。
 * 整体替换占位页（Batch 3 留桩）。
 *
 * 差异：
 * 1. `useRoute`/`useRouter`（`route.query` / `router.replace`）→ 小程序端：
 *    - query 用 `onLoad(options)` 取（orderNo / shopId / pending）
 *    - `router.replace('/order', query)` → `navigateTo(withQuery(ROUTES.ORDER, ...))`
 *    - `router.replace('/shop', query)` → `navigateTo(withQuery(ROUTES.SHOP, ...))`
 *    - **`router.replace('/home')` 死链**（HANDOFF 明确：home 页不在迁移范围）
 *      → `reLaunchToTab(ROUTES.MSITE)`（回落 msite tabBar 首页）
 * 2. `head-top` 显式 import（007 坑 15）
 * 3. `window.setTimeout`/`window.clearTimeout` → `setTimeout`/`clearTimeout`
 *    （小程序有全局定时器，与 HANDOFF 记录的 web-user `:28,30` 差异一致）
 * 4. PENDING 时 2.5s 轮询刷新逻辑与 web-user 逐行一致；PAID 时
 *    `savePaymentSuccessContext` + `cartStore.consumePaidCheckout` 收口到
 *    utils/payment 与 store-cart（uni-user 侧已有同名实现）
 * 5. px → rpx
 */
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'

import Head from '@/components/header/head.vue'
import { withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import {
  createAuthGuard,
  navigateTo,
  reLaunchToTab,
  ROUTES,
} from '@/platform/navigation'
import { getAlipayPaymentStatus } from '@/services/api/api-payment'
import { useCartStore } from '@/stores/modules/store-cart'

import { savePaymentSuccessContext } from '@/utils/payment'

const cartStore = useCartStore()

const loading = ref(true)
const order = ref(null)
let timer = null
let orderNo = ''

onShow(createAuthGuard('/pkg-order/PaymentResult'))

// 取 query（orderNo / shopId / pending），对齐 web-user 的 route.query
onLoad((options) => {
  orderNo = options?.orderNo || ''
  // 立即用 onLoad 的参数跑一次首查
  fetchStatus(options?.pending !== '0')
})

async function fetchStatus(refresh = true) {
  if (!orderNo)
    return

  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  try {
    const result = await getAlipayPaymentStatus(orderNo, refresh)
    order.value = result

    if (result.status === 'PAID') {
      savePaymentSuccessContext({
        orderNo: result.orderNo,
        shopId: result.shopId,
        paidAt: result.paidAt || Date.now(),
      })
      cartStore.consumePaidCheckout(result.shopId)
    }

    if (result.status === 'PENDING')
      timer = setTimeout(fetchStatus, 2500, true)
  }
  catch (error) {
    showToast(error?.message || '查询支付结果失败')
  }
  finally {
    loading.value = false
  }
}

function backToNextPage() {
  if (order.value?.status === 'PAID') {
    navigateTo(withQuery(ROUTES.ORDER, {
      paid: '1',
      orderNo: order.value.orderNo,
    }))
    return
  }

  if (order.value?.shopId) {
    navigateTo(withQuery(ROUTES.SHOP, {
      shopid: order.value.shopId,
      paid: '1',
      orderNo: order.value.orderNo,
    }))
    return
  }

  // ⚠️ 修正 web-user 的 `router.replace('/home')` 死链：
  // home 页不在 uni-user 迁移范围，回落 msite tabBar 首页
  reLaunchToTab(ROUTES.MSITE)
}

onUnload(() => {
  if (timer)
    clearTimeout(timer)
  timer = null
})
</script>

<template>
  <view class="payment-result-page">
    <Head
      head-title="支付结果"
      theme="light"
    />

    <view class="result-content">
      <template v-if="loading">
        <view class="status-icon pending">
          ...
        </view>
        <view class="result-title">
          正在确认支付结果
        </view>
        <view class="result-desc">
          请稍候，我们正在和支付宝同步订单状态。
        </view>
      </template>

      <template v-else-if="order?.status === 'PAID'">
        <view class="status-icon success">
          ✓
        </view>
        <view class="result-title">
          支付成功
        </view>
        <view class="result-desc">
          {{ order.shopName }} 的订单已支付，商家正在为你备餐。
        </view>
        <view class="result-desc order-meta">
          订单号：{{ order.orderNo }}
        </view>
      </template>

      <template v-else-if="order?.status === 'CLOSED'">
        <view class="status-icon closed">
          !
        </view>
        <view class="result-title">
          订单已关闭
        </view>
        <view class="result-desc">
          该订单未完成支付或已关闭，请返回商家页重新下单。
        </view>
      </template>

      <template v-else>
        <view class="status-icon pending">
          ...
        </view>
        <view class="result-title">
          等待支付完成
        </view>
        <view class="result-desc">
          如果你已经完成支付，请稍等几秒后重新查询。
        </view>
      </template>

      <view v-if="order" class="result-card">
        <view class="row">
          <text>订单编号</text>
          <text class="row-value">
            {{ order.orderNo }}
          </text>
        </view>
        <view class="row">
          <text>支付金额</text>
          <text class="row-value">
            ¥{{ Number(order.payableAmount || 0).toFixed(2) }}
          </text>
        </view>
        <view class="row">
          <text>交易状态</text>
          <text class="row-value">
            {{ order.tradeStatus }}
          </text>
        </view>
      </view>

      <view class="actions">
        <view class="btn secondary" @click="fetchStatus(true)">
          重新查询
        </view>
        <view class="btn primary" @click="backToNextPage">
          {{ order?.status === 'PAID' ? '查看订单' : order?.shopId ? '返回商家' : '返回首页' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.payment-result-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f5f9 100%);
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 96rpx);
  padding: 48rpx 32rpx 80rpx;
  text-align: center;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 152rpx;
  height: 152rpx;
  font-size: 68rpx;
  font-weight: 700;
  color: #fff;
  border-radius: 50%;

  &.success {
    background: #19be6b;
  }

  &.pending {
    background: #1677ff;
  }

  &.closed {
    background: #fa8c16;
  }
}

.result-title {
  margin-top: 36rpx;
  font-size: 48rpx;
  color: #1f2329;
}

.result-desc {
  margin-top: 20rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: #5b6573;
}

.order-meta {
  color: #8a94a3;
}

.result-card {
  width: 100%;
  padding: 32rpx;
  margin-top: 48rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 24rpx 64rpx rgb(22 119 255 / 8%);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
  font-size: 28rpx;
  color: #5b6573;

  .row-value {
    font-size: 28rpx;
    color: #1f2329;
  }
}

.actions {
  display: flex;
  gap: 24rpx;
  width: 100%;
  margin-top: 40rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 88rpx;
  text-align: center;
  border-radius: 999rpx;

  &.primary {
    color: #fff;
    background: #1677ff;
  }

  &.secondary {
    color: #1677ff;
    background: #eaf2ff;
  }
}
</style>
