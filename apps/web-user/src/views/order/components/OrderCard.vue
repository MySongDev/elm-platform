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
})

const canContinuePayment = computed(() => props.order.status === 'PENDING')

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
    </div>
  </article>
</template>

<style lang="scss" scoped>
.order-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #edf0f5;
  box-shadow: 0 6px 18px rgba(31, 35, 41, 0.04);
}

.order-card.highlighted {
  border-color: #19be6b;
  box-shadow: 0 8px 22px rgba(25, 190, 107, 0.14);
}

.order-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.shop-info {
  min-width: 0;
}

.shop-name {
  margin: 0;
  color: #1f2329;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
}

.order-no {
  margin-top: 5px;
  color: #8a8f99;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.status-tag {
  flex: 0 0 auto;
  min-width: 58px;
  height: 26px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;

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
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.amount-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.amount-label {
  color: #8a8f99;
  font-size: 12px;
}

.amount-value {
  color: #ff4d4f;
  font-size: 20px;
  line-height: 1.2;
}

.meta-list {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px 10px;
  color: #687080;
  font-size: 12px;
  line-height: 1.4;
}

.continue-button {
  flex: 0 0 auto;
  height: 32px;
  border: 0;
  border-radius: 16px;
  padding: 0 14px;
  background: #19be6b;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
</style>
