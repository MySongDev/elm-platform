<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/payment/payment.vue 同源改造（在线支付页）。
 * 整体替换占位页（Batch 3 留桩，2 天）。
 *
 * 差异：
 * 1. `useRoute`（`route.query.shopName`）→ `onLoad(options)` 取 query
 * 2. **发起支付**：web-user 用 `createAlipayWapPayment` + `window.location.href = payUrl`
 *    （支付宝 H5 收银台整页跳转），小程序端没有 window.location，且支付宝 WAP 在
 *    微信小程序里打不开。改走 platform/payment 的 `requestPayment`（渠道无关 L2 接缝），
 *    小程序端内部走微信：可信建单 → 金额核对 → `uni.requestPayment`。
 * 3. `showAlert`（AlterTip DOM）→ platform/feedback showToast
 * 4. 导航统一走原生导航栏（2026-11-07）：原蓝色 head-top（`Head` 组件，
 *    与原生栏双头）已移除，页面标题由 pages.json 的 navigationBarTitleText 承担，
 *    返回按钮用微信原生 ←。`Head` 组件无引用方后按死代码留档策略处理。
 * 5. 支付成功后 web-user 跳转 payUrl 会离开 App 到支付宝收银台；
 *    小程序端收银台走完后跳 PaymentResult 查单，**查到 PAID 才算付款成功**。
 *    收银台返回成功只代表用户在弹窗里点了确认，不能据此清车。
 * 6. px → rpx
 *
 * ★ 微信流程的三个硬约束（都在下面的代码里落实）：
 * - 建单前先登记快照拿 requestId 并落盘，重试沿用同一个 ID，后端才回原单；
 * - 已有 orderNo 后再点支付只续付，绝不重复建单；
 * - 用户取消不提示为错误、也不清草稿——单已建好，回订单列表能续付；
 * - 建单成功不等于付款成功：本页不写付款成功上下文，只把单号绑到快照。
 *   否则用户取消后返回商家页，还没买的商品会被当成已付款扣掉。
 */
import { onLoad, onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { useCheckoutEntry } from '@/composables/features/useCheckoutEntry'
import { withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { createAuthGuard, navigateTo, ROUTES } from '@/platform/navigation'
import { requestPayment } from '@/platform/payment'
import { useCartStore } from '@/stores/modules/store-cart'
import { useUserStore } from '@/stores/modules/store-user'
import { buildSingleShopSelection } from '@/utils/checkout-entry'
import { clearPaymentCheckoutDraft, getPaymentCheckoutDraft } from '@/utils/payment'
import { checkPayableAmount } from '@/utils/payment-flow'

const userStore = useUserStore()
const cartStore = useCartStore()
const { isLogin } = storeToRefs(userStore)
const checkoutEntry = useCheckoutEntry()

const isPaying = ref(false)
// 本次已经建好的单号：非空后再次点支付只续付，不再建单。
const createdOrderNo = ref('')
// 本次建单绑定的 requestId，服务端确认 CLOSED 时用它结束旧快照。
let checkoutRequestId = ''
// 服务端权威应付额（元）。建单后若与页面估价不同，用它覆盖展示，让用户看到真实要付的钱。
const payableAmountOverride = ref(0)
// 本次发起支付前用户看到的金额，用于和服务端金额比对（不能用覆盖后的值自称一致）。
const shownAmountBeforeRequest = ref(0)
const selectedMethod = ref('wechat')
const draft = ref(getPaymentCheckoutDraft())
// query.shopName 兜底（onLoad 传入）
const shopNameFromQuery = ref('')

// 支付渠道由运行端决定，不是用户可选项：小程序只能走微信原生支付，
// H5 只能跳支付宝。给一个「可选」的假选项会让用户以为能换渠道。
const paymentMethods = [
  // #ifdef MP-WEIXIN
  {
    key: 'wechat',
    name: '微信支付',
    desc: '使用微信支付完成付款',
    icon: '微',
  },
  // #endif
  // #ifndef MP-WEIXIN
  {
    key: 'alipay',
    name: '支付宝支付',
    desc: '跳转支付宝收银台完成付款',
    icon: '支',
  },
  // #endif
]

const shopName = computed(() => draft.value?.shopName || shopNameFromQuery.value || '当前商家')
const goodsAmount = computed(() => Number(draft.value?.goodsAmount || 0))
const deliveryFee = computed(() => Number(draft.value?.deliveryFee || 0))
const totalQty = computed(() => Number(draft.value?.totalQty || 0))
const payableAmount = computed(() =>
  payableAmountOverride.value > 0
    ? payableAmountOverride.value
    : goodsAmount.value + deliveryFee.value,
)
const cartItems = computed(() => draft.value?.cartItems || [])
const canSubmit = computed(() => cartItems.value.length > 0 && payableAmount.value > 0)
const hasDraft = computed(() => Boolean(draft.value?.shopId && cartItems.value.length))

onShow(createAuthGuard('/pkg-order/payment'))

async function pay() {
  // 处理中直接忽略重复点击，不弹「订单不完整」这种误导提示。
  if (isPaying.value)
    return

  if (!isLogin.value) {
    showToast('请登录后再支付')
    return
  }

  if (!canSubmit.value) {
    showToast('订单信息不完整，请返回商家页重新结算')
    return
  }

  // 已经有单号（上次建单成功但没付完）：只续付，绝不重复建单。
  if (createdOrderNo.value) {
    await launchExistingOrder(createdOrderNo.value)
    return
  }

  const selection = buildSingleShopSelection(cartItems.value.map(item => ({
    shopId: item.shopId ?? draft.value?.shopId,
    shopName: item.shopName ?? draft.value?.shopName,
    itemId: item.itemId,
    skuId: item.skuId,
    qty: item.qty,
  })))
  if (!selection) {
    showToast('结算商品信息不完整，请返回重新选择')
    return
  }

  try {
    isPaying.value = true
    // 先登记快照拿 requestId 并落盘：建单响应丢失后重试要带同一个 ID，后端才回原单。
    const requestId = checkoutEntry.beginCheckout({
      userId: userStore.userId,
      shopId: selection.shopId,
      cartItems: selection.cartItems,
    })
    checkoutRequestId = requestId

    // 记下发起前的展示价：金额比对必须拿它去比，不能用已被覆盖后的 payableAmount。
    shownAmountBeforeRequest.value = payableAmount.value

    const result = await requestPayment({
      requestId,
      shopId: selection.shopId,
      shopName: selection.shopName,
      deliveryFee: draft.value.deliveryFee,
      cartItems: draft.value.cartItems,
      shownAmount: payableAmount.value,
      onOrderCreated: (order) => {
        createdOrderNo.value = order.orderNo
        checkoutEntry.bindOrder(userStore.userId, requestId, order.orderNo)
      },
    })

    handlePaymentResult(result)
  }
  catch (error) {
    showToast(error?.message || '发起支付失败，请稍后再试')
  }
  finally {
    isPaying.value = false
  }
}

/** 已有订单号时续付：不建单，只重新拉起收银台。 */
async function launchExistingOrder(orderNo) {
  try {
    isPaying.value = true
    const result = await requestPayment({
      orderNo,
      shopId: draft.value?.shopId ?? '',
      shopName: draft.value?.shopName ?? '',
      deliveryFee: 0,
      cartItems: [],
    })
    handlePaymentResult(result)
  }
  catch (error) {
    showToast(error?.message || '继续支付失败，请稍后再试')
  }
  finally {
    isPaying.value = false
  }
}

/**
 * 收银台结果 → 下一步。
 *
 * ⚠️ 只有「收银台走完」才去结果页查单；查到 PAID 才算付款成功。
 * 取消不提示为错误（用户自己的选择），也不清草稿——单已经建好了，回列表能续付。
 */
function handlePaymentResult(result) {
  // 已终结原单：未付款不能写成功上下文，否则返回商家页会把还没买的商品扣掉。
  if (result?.outcome === 'closed') {
    if (result.orderNo)
      endClosedCheckout(result.orderNo)
    showToast(result.message || '原订单已关闭，请重新下单')
    return
  }

  if (result?.orderNo && !createdOrderNo.value) {
    createdOrderNo.value = result.orderNo
    checkoutEntry.bindOrder(userStore.userId, checkoutRequestId, result.orderNo)
  }

  if (result?.outcome === 'canceled') {
    showToast('已取消支付')
    return
  }

  // 金额被服务端改过：刷新展示让用户看清楚再决定，不直接按新价扣钱。
  if (result?.payableAmount !== undefined && result.outcome === undefined && !result.success) {
    const check = checkPayableAmount({
      shownAmount: shownAmountBeforeRequest.value,
      serverAmount: result.payableAmount,
    })
    if (check === 'mismatch') {
      // 必须清掉单号：否则下次点击直接走「只续付」，用户还没确认新价格就被扣款。
      // 再点时会带同一个 requestId 重新建单，后端回原单，不会多建一张。
      createdOrderNo.value = ''
      refreshDraftAmount(result.payableAmount)
      showToast(result.message || '价格已更新，请确认后重新支付')
      return
    }
  }

  if (result?.success && result.orderNo) {
    // 已付款不删草稿：万一结果页查不到 PAID，返回这里仍能按原单续付而不是重新建单。
    navigateTo(withQuery(ROUTES.PAYMENT_RESULT, {
      orderNo: result.orderNo,
      shopId: draft.value?.shopId ?? '',
      paymentChannel: 'WECHAT',
    }))
    return
  }

  showToast(result?.message || '支付未完成，可在订单列表继续支付')
}

/** 结束后端确认关闭的订单：清掉只属于原单的草稿，下次支付用新 requestId 重新建单。 */
function endClosedCheckout(orderNo) {
  cartStore.closeCheckoutSnapshot(userStore.userId, {
    orderNo,
    shopId: draft.value?.shopId ?? '',
    status: 'CLOSED',
  })
  if (orderNo === createdOrderNo.value) {
    createdOrderNo.value = ''
    payableAmountOverride.value = 0
    clearPaymentCheckoutDraft()
  }
}

/**
 * 用服务端权威金额刷新页面展示，避免继续按旧估价发起支付。
 *
 * 服务端返回的是**应付总额**，不是商品金额，所以记到 payableAmountOverride 上，
 * 不再拆回 goodsAmount/deliveryFee——拆错了会让页面显示一个新的错误总价。
 */
function refreshDraftAmount(serverAmount) {
  payableAmountOverride.value = Number(serverAmount)
}

// query.shopName 兜底（onLoad 传入，对齐 web-user 的 route.query.shopName）
onLoad((options) => {
  shopNameFromQuery.value = options?.shopName || ''
})
</script>

<template>
  <view class="payment-page">
    <view class="payment-content">
      <view class="amount-panel">
        <text class="amount-label">
          待支付金额
        </text>
        <text class="amount-value">
          ¥{{ payableAmount.toFixed(2) }}
        </text>
        <text class="shop-name">
          {{ shopName }}
        </text>
      </view>

      <view class="order-card">
        <view class="card-title">
          订单信息
        </view>
        <view v-if="!hasDraft" class="empty-tip">
          未读取到结算单，请返回商家页重新选择商品后再支付。
        </view>
        <view class="detail-row">
          <text>商品数量</text>
          <text>{{ totalQty }} 件</text>
        </view>
        <view class="detail-row">
          <text>商品金额</text>
          <text>¥{{ goodsAmount.toFixed(2) }}</text>
        </view>
        <view class="detail-row">
          <text>配送费</text>
          <text>¥{{ deliveryFee.toFixed(2) }}</text>
        </view>
      </view>

      <view class="method-card">
        <view class="card-title">
          支付方式
        </view>
        <view
          v-for="method in paymentMethods"
          :key="method.key"
          class="method-item"
          :class="{ active: selectedMethod === method.key }"
          @click="selectedMethod = method.key"
        >
          <view class="method-icon">
            {{ method.icon }}
          </view>
          <view class="method-copy">
            <text class="method-name">
              {{ method.name }}
            </text>
            <text class="method-desc">
              {{ method.desc }}
            </text>
          </view>
          <view class="method-check" />
        </view>
      </view>
    </view>

    <view class="payment-footer">
      <view>
        <text class="footer-label">
          合计
        </text>
        <text class="footer-value">
          ¥{{ payableAmount.toFixed(2) }}
        </text>
      </view>
      <view
        class="pay-btn"
        :class="{ 'is-disabled': isPaying || !canSubmit }"
        @click="!isPaying && canSubmit ? pay() : showToast('订单信息不完整')"
      >
        {{ isPaying ? '正在处理...' : '确认支付' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.payment-page {
  min-height: 100vh;
  padding-bottom: 152rpx;
  color: #222;
  background: #f5f7fa;
}

.payment-content {
  padding: 24rpx;
}

.amount-panel {
  padding: 48rpx 32rpx;
  text-align: center;
  background: linear-gradient(135deg, #1677ff, #19be6b);
  border-radius: 16rpx;

  .amount-label {
    font-size: 26rpx;
    opacity: 0.9;
  }

  .amount-value {
    display: block;
    margin-top: 16rpx;
    font-size: 68rpx;
    line-height: 1.15;
  }

  .shop-name {
    display: block;
    margin-top: 16rpx;
    font-size: 28rpx;
  }
}

.order-card,
.method-card {
  padding: 28rpx;
  margin-top: 24rpx;
  background: #fff;
  border-radius: 16rpx;
}

.card-title {
  margin-bottom: 24rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.empty-tip {
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  font-size: 26rpx;
  line-height: 1.5;
  color: #d46b08;
  background: #fff7e6;
  border-radius: 16rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60rpx;
  font-size: 28rpx;
  color: #666;

  text:last-child {
    color: #222;
  }
}

.method-item {
  display: flex;
  gap: 20rpx;
  align-items: center;
  width: 100%;
  min-height: 124rpx;
  padding: 20rpx;
  margin-top: 20rpx;
  text-align: left;
  background: #fff;
  border: 2rpx solid #edf0f5;
  border-radius: 16rpx;

  &.active {
    background: #f2f8ff;
    border-color: #1677ff;

    .method-check {
      background: #1677ff;
      border-color: #1677ff;

      &::after {
        opacity: 1;
      }
    }
  }
}

.method-icon {
  display: flex;
  flex: 0 0 72rpx;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  font-weight: 700;
  color: #1677ff;
  background: #eef7ff;
  border-radius: 50%;
}

.method-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;

  .method-name {
    font-size: 30rpx;
    color: #222;
  }

  .method-desc {
    font-size: 24rpx;
    color: #8a8f99;
  }
}

.method-check {
  position: relative;
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #c9ced6;
  border-radius: 50%;

  &::after {
    position: absolute;
    top: 4rpx;
    left: 10rpx;
    width: 10rpx;
    height: 18rpx;
    content: '';
    border: solid #fff;
    border-width: 0 4rpx 4rpx 0;
    opacity: 0;
    transform: rotate(45deg);
  }
}

.payment-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  gap: 24rpx;
  align-items: center;
  justify-content: space-between;
  height: 128rpx;
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -8rpx 32rpx rgb(0 0 0 / 8%);

  .footer-label {
    display: block;
    font-size: 24rpx;
    color: #777;
  }

  .footer-value {
    font-size: 40rpx;
    color: #ff4d4f;
  }
}

.pay-btn {
  flex: 0 0 auto;
  width: 312rpx;
  height: 88rpx;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 88rpx;
  color: #fff;
  text-align: center;
  background: #19be6b;
  border-radius: 12rpx;

  &.is-disabled {
    opacity: 0.7;
  }
}
</style>
