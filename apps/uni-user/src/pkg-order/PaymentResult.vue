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
 * 2. 导航统一走原生导航栏（2026-11-07）：原蓝色 head-top（`Head` 组件，
 *    与原生栏双头）已移除，页面标题由 pages.json 的 navigationBarTitleText 承担。
 * 3. `window.setTimeout`/`window.clearTimeout` → `setTimeout`/`clearTimeout`
 *    （小程序有全局定时器，与 HANDOFF 记录的 web-user `:28,30` 差异一致）
 * 4. PENDING 时 2.5s 轮询刷新逻辑与 web-user 逐行一致；PAID 时
 *    `savePaymentSuccessContext` + `cartStore.consumePaidCheckout` 收口到
 *    utils/payment 与 store-cart（uni-user 侧已有同名实现）
 * 5. px → rpx
 */
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { ref } from 'vue'

import { withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import {
  createAuthGuard,
  navigateTo,
  reLaunchToTab,
  ROUTES,
} from '@/platform/navigation'
import { getPaymentStatusByChannel } from '@/services/api/api-payment'
import { useCartStore } from '@/stores/modules/store-cart'
import { useUserStore } from '@/stores/modules/store-user'

import { savePaymentSuccessContext } from '@/utils/payment'
import { decideSettlementAction, shouldContinuePolling } from '@/utils/payment-flow'

const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(true)
const order = ref(null)
let timer = null
let orderNo = ''
// 页面上报的渠道（结果页入口可能没带，首查拿到摘要后补上）。
let channelHint = ''
// 每次页面显示/隐藏递增，用来丢弃离开页面后才回来的迟到响应。
let activeRevision = 0
let pageActive = true
let pollAttempts = 0

onShow(createAuthGuard('/pkg-order/PaymentResult'))

// 取 query（orderNo / shopId / pending），对齐 web-user 的 route.query
onLoad((options) => {
  orderNo = options?.orderNo || ''
  channelHint = options?.paymentChannel || ''
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

  const revision = activeRevision
  try {
    // 按渠道查：微信单查支付宝永远回「未支付」，用户会看到假 PENDING。
    // 首查时还不确定渠道，先按提示走，拿到摘要后用它自己的 paymentChannel。
    const channel = channelHint || order.value?.paymentChannel || ''
    const result = await getPaymentStatusByChannel(orderNo, channel, refresh)
    // 迟到的响应：页面已离开或已开始新一轮查询，丢弃，别改当前状态。
    if (revision !== activeRevision || !pageActive)
      return

    order.value = result
    channelHint = result?.paymentChannel || channelHint

    const action = decideSettlementAction(result)

    if (action === 'paid') {
      savePaymentSuccessContext({
        orderNo: result.orderNo,
        shopId: result.shopId,
        paidAt: result.paidAt || Date.now(),
        status: result.status,
        userId: String(userStore.userId),
        paymentChannel: result.paymentChannel,
      })
      // 返回商家页会再次处理成功上下文；已消费快照不能再触发旧清车兜底。
      const outcome = cartStore.consumePaidSnapshot(userStore.userId, {
        orderNo: result.orderNo,
        shopId: result.shopId,
        status: result.status,
      })
      if (outcome === 'missing' && result.paymentChannel !== 'WECHAT')
        cartStore.consumePaidCheckout(result.shopId)
    }
    else if (action === 'closed' && result?.status === 'CLOSED') {
      cartStore.closeCheckoutSnapshot(userStore.userId, result)
    }

    pollAttempts += 1
    if (action === 'needs-resubmit') {
      // 非微信渠道的 PENDING 在这端没法付款，一直轮询只会等一个不会来的结果。
      showToast('该订单需回商家页重新结算')
      return
    }

    if (action === 'keep-polling'
      && shouldContinuePolling({
        attempts: pollAttempts,
        active: pageActive,
      })) {
      timer = setTimeout(fetchStatus, 2500, true)
    }
  }
  catch (error) {
    // 查询失败保留页面上已有的恢复信息：不弹错就清空，用户还能点「查看订单」回来重试。
    if (revision === activeRevision && pageActive)
      showToast(error?.message || '查询支付结果失败')
  }
  finally {
    if (revision === activeRevision)
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

// 页面隐藏/卸载都要停轮询：切走后继续打接口，回来的迟到响应还会改已离开的页面状态。
onHide(() => {
  pageActive = false
  activeRevision += 1
  if (timer)
    clearTimeout(timer)
  timer = null
})

onShow(() => {
  if (!pageActive) {
    pageActive = true
    activeRevision += 1
    // 回到页面时恢复查询（轮询可能是在后台被停掉的）。
    if (!timer && orderNo && order.value?.status !== 'PAID')
      fetchStatus(true)
  }
})

onUnload(() => {
  pageActive = false
  activeRevision += 1
  if (timer)
    clearTimeout(timer)
  timer = null
})
</script>

<template>
  <view class="payment-result-page">
    <view class="result-content">
      <template v-if="loading">
        <view class="status-icon pending">
          ...
        </view>
        <view class="result-title">
          正在确认支付结果
        </view>
        <view class="result-desc">
          请稍候，我们正在同步订单状态。
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

  /* 2026-11-07：蓝色 Head 已移除，结果区直接撑满 webview 可视区做垂直居中
     （原 calc(100vh - 96rpx) 是为 90rpx 的 Head 让位，Head 删了就是负补偿） */
  min-height: 100vh;
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
