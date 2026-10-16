<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/order/components/OrderCard.vue 同源改造。
 * 差异：
 * 1. div/article/span/strong/p/button → view/text（小程序无这些标签）；
 *    按钮改 view + @click
 * 2. `data-test` 属性小程序端无意义（无 e2e 选择器），删掉
 * 3. px → rpx
 * 4. `Intl.DateTimeFormat` 小程序支持（V8），保留
 * 5. status/fulfillment/refund 的文案 map 逻辑与 web-user 逐行一致（纯展示映射）
 */
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  highlight: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits({
  'continue-payment': order => Boolean(order?.orderNo),
  'request-refund': order => Boolean(order?.orderNo),
})

const canContinuePayment = computed(() => props.order.status === 'PENDING')

const canRequestRefund = computed(() => {
  return Array.isArray(props.order.customerAvailableActions)
    && props.order.customerAvailableActions.includes('REQUEST_REFUND')
})

const statusMap = {
  PAID: {
    label: '已支付',
    className: 'paid',
  },
  PENDING: {
    label: '待支付',
    className: 'pending',
  },
  CLOSED: {
    label: '已关闭',
    className: 'closed',
  },
}

const statusMeta = computed(() => {
  return statusMap[props.order.status] || {
    label: props.order.status || '未知',
    className: 'unknown',
  }
})

const fulfillmentStatusMap = {
  PENDING_PAYMENT: '待支付',
  AWAITING_ACCEPTANCE: '待接单',
  ACCEPTED: '已接单',
  PREPARING: '制作中',
  DELIVERING: '配送中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
}

const refundStatusMap = {
  NONE: '',
  REQUESTED: '退款申请中',
  APPROVED: '退款已同意',
  REJECTED: '退款已驳回',
}

const fulfillmentText = computed(() => fulfillmentStatusMap[props.order.fulfillmentStatus] || '')
const refundText = computed(() => refundStatusMap[props.order.refundStatus] || '')
const amountText = computed(() => Number(props.order.payableAmount || 0).toFixed(2))
const totalQty = computed(() => Number(props.order.totalQty || 0))

const orderTime = computed(() => {
  return props.order.paidAt || props.order.updatedAt || props.order.createdAt || ''
})

const timeText = computed(() => {
  if (!orderTime.value)
    return '暂无时间'

  const date = new Date(orderTime.value)
  if (Number.isNaN(date.getTime()))
    return orderTime.value

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})
</script>

<template>
  <view class="order-card" :class="{ highlighted: highlight }">
    <view class="order-card__header">
      <view class="shop-info">
        <text class="shop-name">
          {{ order.shopName || '饿了么订单' }}
        </text>
        <text class="order-no">
          {{ order.orderNo }}
        </text>
      </view>
      <view class="status-tag" :class="statusMeta.className">
        {{ statusMeta.label }}
      </view>
    </view>

    <view class="order-card__body">
      <view class="amount-block">
        <text class="amount-label">
          实付金额
        </text>
        <text class="amount-value">
          ¥{{ amountText }}
        </text>
      </view>
      <view class="meta-list">
        <text>{{ timeText }}</text>
        <text v-if="totalQty">
          共 {{ totalQty }} 件
        </text>
        <text v-if="order.tradeStatus">
          {{ order.tradeStatus }}
        </text>
        <text v-if="fulfillmentText">
          {{ fulfillmentText }}
        </text>
        <text v-if="refundText">
          {{ refundText }}
        </text>
      </view>
      <view
        v-if="canContinuePayment"
        class="continue-button"
        @click="emit('continue-payment', order)"
      >
        继续支付
      </view>
      <view
        v-if="canRequestRefund"
        class="refund-button"
        @click="emit('request-refund', order)"
      >
        申请退款
      </view>
    </view>
    <text v-if="order.refundStatus === 'REJECTED' && order.refundRejectReason" class="refund-reason">
      驳回原因：{{ order.refundRejectReason }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.order-card {
  padding: 28rpx;
  background: #fff;
  border: 2rpx solid #edf0f5;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 36rpx rgb(31 35 41 / 4%);
}

.order-card.highlighted {
  border-color: #19be6b;
  box-shadow: 0 16rpx 44rpx rgb(25 190 107 / 14%);
}

.order-card__header {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
  justify-content: space-between;
}

.shop-info {
  min-width: 0;
}

.shop-name {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.35;
  color: #1f2329;
}

.order-no {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.4;
  color: #8a8f99;
  word-break: break-all;
}

.status-tag {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 116rpx;
  height: 52rpx;
  padding: 0 16rpx;
  font-size: 24rpx;
  font-weight: 700;
  border-radius: 8rpx;

  &.paid {
    color: #0f8f4f;
    background: #e9f8f0;
  }

  &.pending {
    color: #b36b00;
    background: #fff4de;
  }

  &.closed,
  &.unknown {
    color: #687080;
    background: #f0f2f5;
  }
}

.order-card__body {
  display: flex;
  gap: 24rpx;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 28rpx;
}

.amount-block {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.amount-label {
  font-size: 24rpx;
  color: #8a8f99;
}

.amount-value {
  font-size: 40rpx;
  line-height: 1.2;
  color: #ff4d4f;
}

.meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx 20rpx;
  justify-content: flex-end;
  min-width: 0;
  font-size: 24rpx;
  line-height: 1.4;
  color: #687080;
}

.continue-button {
  flex: 0 0 auto;
  height: 64rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 64rpx;
  color: #fff;
  text-align: center;
  background: #19be6b;
  border-radius: 32rpx;
}

.refund-button {
  flex: 0 0 auto;
  height: 64rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 64rpx;
  color: #ff4d4f;
  text-align: center;
  background: #fff1f0;
  border-radius: 32rpx;
}

.refund-reason {
  margin: 20rpx 0 0;
  font-size: 24rpx;
  line-height: 1.5;
  color: #ff4d4f;
}
</style>
