<script setup>
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
  <article class="order-card" :class="{ highlighted: highlight }">
    <div class="order-card__header">
      <div class="shop-info">
        <h3 class="shop-name">
          {{ order.shopName || '饿了么订单' }}
        </h3>
        <p class="order-no">
          {{ order.orderNo }}
        </p>
      </div>
      <span class="status-tag" :class="statusMeta.className">
        {{ statusMeta.label }}
      </span>
    </div>

    <div class="order-card__body">
      <div class="amount-block">
        <span class="amount-label">实付金额</span>
        <strong class="amount-value">¥{{ amountText }}</strong>
      </div>
      <div class="meta-list">
        <span>{{ timeText }}</span>
        <span v-if="totalQty">共 {{ totalQty }} 件</span>
        <span v-if="order.tradeStatus">{{ order.tradeStatus }}</span>
        <span v-if="fulfillmentText">{{ fulfillmentText }}</span>
        <span v-if="refundText">{{ refundText }}</span>
      </div>
      <button
        v-if="canContinuePayment"
        class="continue-button"
        data-test="continue-payment"
        type="button"
        @click="emit('continue-payment', order)"
      >
        继续支付
      </button>
      <button
        v-if="canRequestRefund"
        class="refund-button"
        data-test="request-refund"
        type="button"
        @click="emit('request-refund', order)"
      >
        申请退款
      </button>
    </div>
    <p v-if="order.refundStatus === 'REJECTED' && order.refundRejectReason" class="refund-reason">
      驳回原因：{{ order.refundRejectReason }}
    </p>
  </article>
</template>

<style lang="scss" scoped>
.order-card {
  padding: 14px;
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgb(31 35 41 / 4%);
}

.order-card.highlighted {
  border-color: #19be6b;
  box-shadow: 0 8px 22px rgb(25 190 107 / 14%);
}

.order-card__header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.shop-info {
  min-width: 0;
}

.shop-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: #1f2329;
}

.order-no {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: #8a8f99;
  word-break: break-all;
}

.status-tag {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;

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
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 14px;
}

.amount-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.amount-label {
  font-size: 12px;
  color: #8a8f99;
}

.amount-value {
  font-size: 20px;
  line-height: 1.2;
  color: #ff4d4f;
}

.meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  justify-content: flex-end;
  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #687080;
}

.continue-button,
.refund-button {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #19be6b;
  border: 0;
  border-radius: 16px;
}

.refund-button {
  color: #ff4d4f;
  background: #fff1f0;
}

.refund-reason {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #ff4d4f;
}
</style>
