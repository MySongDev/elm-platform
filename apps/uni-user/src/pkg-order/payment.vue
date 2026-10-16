<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/payment/payment.vue 同源改造（在线支付页）。
 * 整体替换占位页（Batch 3 留桩，2 天）。
 *
 * 差异：
 * 1. `useRoute`（`route.query.shopName`）→ `onLoad(options)` 取 query
 * 2. **发起支付**：web-user 用 `createAlipayWapPayment` + `window.location.href = payUrl`
 *    （支付宝 H5 收银台整页跳转），小程序端没有 window.location，且支付宝 WAP 在
 *    微信小程序里打不开。改走 platform/payment 的 `requestPayment`（渠道无关 L2 接缝）——
 *    小程序端当前返回「当前端暂不支持支付」的留桩（建单已在后端独立完成，
 *    将来接微信支付时调用方零改动）。详见 platform/payment.ts 头部说明。
 * 3. `showAlert`（AlterTip DOM）→ platform/feedback showToast
 * 4. `head-top` 显式 import（007 坑 15）
 * 5. 支付成功后 web-user 跳转 payUrl 会离开 App 到支付宝收银台；
 *    小程序端 requestPayment 返回 success 后跳 PaymentResult 页查询结果
 *    （对齐 PaymentResult 的 PENDING 轮询逻辑）。当前留桩永远 success=false，
 *    所以实际只走到「暂不支持支付」的提示分支。
 * 6. px → rpx
 */
import { onLoad, onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import Head from '@/components/header/head.vue'
import { withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { createAuthGuard, navigateTo, ROUTES } from '@/platform/navigation'
import { requestPayment } from '@/platform/payment'
import { useUserStore } from '@/stores/modules/store-user'
import { clearPaymentCheckoutDraft, getPaymentCheckoutDraft } from '@/utils/payment'

const userStore = useUserStore()
const { isLogin } = storeToRefs(userStore)

const isPaying = ref(false)
const selectedMethod = ref('alipay')
const draft = ref(getPaymentCheckoutDraft())
// query.shopName 兜底（onLoad 传入）
const shopNameFromQuery = ref('')

const paymentMethods = [
  {
    key: 'alipay',
    name: '支付宝支付',
    desc: '跳转支付宝收银台完成付款',
    icon: '支',
  },
]

const shopName = computed(() => draft.value?.shopName || shopNameFromQuery.value || '当前商家')
const goodsAmount = computed(() => Number(draft.value?.goodsAmount || 0))
const deliveryFee = computed(() => Number(draft.value?.deliveryFee || 0))
const totalQty = computed(() => Number(draft.value?.totalQty || 0))
const payableAmount = computed(() => goodsAmount.value + deliveryFee.value)
const cartItems = computed(() => draft.value?.cartItems || [])
const canSubmit = computed(() => cartItems.value.length > 0 && payableAmount.value > 0)
const hasDraft = computed(() => Boolean(draft.value?.shopId && cartItems.value.length))

onShow(createAuthGuard('/pkg-order/payment'))

async function pay() {
  if (!isLogin.value) {
    showToast('请登录后再支付')
    return
  }

  if (!canSubmit.value) {
    showToast('订单信息不完整，请返回商家页重新结算')
    return
  }

  try {
    isPaying.value = true
    const result = await requestPayment({
      shopId: draft.value.shopId,
      shopName: draft.value.shopName,
      deliveryFee: draft.value.deliveryFee,
      cartItems: draft.value.cartItems,
    })

    if (result.success && result.orderNo) {
      // H5/App 端真正支付成功会拿到 orderNo（小程序端当前留桩永远 false）
      clearPaymentCheckoutDraft()
      navigateTo(withQuery(ROUTES.PAYMENT_RESULT, {
        orderNo: result.orderNo,
        shopId: draft.value.shopId,
      }))
      return
    }

    // 小程序端当前分支：留桩「暂不支持支付」
    showToast(result.message || '发起支付失败，请稍后再试')
  }
  catch (error) {
    showToast(error?.message || '发起支付失败，请稍后再试')
  }
  finally {
    isPaying.value = false
  }
}

// query.shopName 兜底（onLoad 传入，对齐 web-user 的 route.query.shopName）
onLoad((options) => {
  shopNameFromQuery.value = options?.shopName || ''
})
</script>

<template>
  <view class="payment-page">
    <Head
      head-title="在线支付"
      theme="light"
    />

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
