<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip'
import { createAlipayWapPayment } from '@/services/api/api-payment'
import { useUserStore } from '@/stores/modules/store-user'
import { clearPaymentCheckoutDraft, getPaymentCheckoutDraft } from '@/untils/payment'
import { getStore } from '@/untils/storage'

defineOptions({
  name: 'ShopPayment',
})

const route = useRoute()
const userStore = useUserStore()
const { userId } = storeToRefs(userStore)

const isPaying = ref(false)
const selectedMethod = ref('alipay')
const draft = ref(getPaymentCheckoutDraft())

const paymentMethods = [
  {
    key: 'alipay',
    name: '支付宝支付',
    desc: '跳转支付宝收银台完成付款',
    icon: '支',
  },
]

const shopName = computed(() => draft.value?.shopName || route.query.shopName || '当前商家')
const goodsAmount = computed(() => Number(draft.value?.goodsAmount || 0))
const deliveryFee = computed(() => Number(draft.value?.deliveryFee || 0))
const totalQty = computed(() => Number(draft.value?.totalQty || 0))
const payableAmount = computed(() => goodsAmount.value + deliveryFee.value)
const cartItems = computed(() => draft.value?.cartItems || [])
const canSubmit = computed(() => cartItems.value.length > 0 && payableAmount.value > 0)
const hasDraft = computed(() => Boolean(draft.value?.shopId && cartItems.value.length))
const currentUserId = computed(() => String(userId.value || getStore('user_id') || ''))

async function pay() {
  if (!currentUserId.value) {
    showAlert('请登录后再支付')
    return
  }

  if (!canSubmit.value) {
    showAlert('订单信息不完整，请返回商家页重新结算')
    return
  }

  try {
    isPaying.value = true
    const { payUrl } = await createAlipayWapPayment({
      userId: currentUserId.value,
      shopId: draft.value.shopId,
      shopName: draft.value.shopName,
      deliveryFee: draft.value.deliveryFee,
      cartItems: draft.value.cartItems,
    })

    clearPaymentCheckoutDraft()
    window.location.href = payUrl
  }
  catch (error) {
    showAlert(error?.message || '发起支付宝支付失败，请稍后再试')
  }
  finally {
    isPaying.value = false
  }
}
</script>

<template>
  <div class="payment-page">
    <head-top head-title="在线支付" />

    <main class="payment-content">
      <section class="amount-panel">
        <p class="amount-label">
          待支付金额
        </p>
        <strong class="amount-value">¥{{ payableAmount.toFixed(2) }}</strong>
        <p class="shop-name">
          {{ shopName }}
        </p>
      </section>

      <section class="order-card">
        <div class="card-title">
          订单信息
        </div>
        <div v-if="!hasDraft" class="empty-tip">
          未读取到结算单，请返回商家页重新选择商品后再支付。
        </div>
        <div class="detail-row">
          <span>商品数量</span>
          <span>{{ totalQty }} 件</span>
        </div>
        <div class="detail-row">
          <span>商品金额</span>
          <span>¥{{ goodsAmount.toFixed(2) }}</span>
        </div>
        <div class="detail-row">
          <span>配送费</span>
          <span>¥{{ deliveryFee.toFixed(2) }}</span>
        </div>
      </section>

      <section class="method-card">
        <div class="card-title">
          支付方式
        </div>
        <button v-for="method in paymentMethods" :key="method.key" class="method-item"
          :class="{ active: selectedMethod === method.key }" type="button" @click="selectedMethod = method.key">
          <span class="method-icon">{{ method.icon }}</span>
          <span class="method-copy">
            <strong>{{ method.name }}</strong>
            <small>{{ method.desc }}</small>
          </span>
          <span class="method-check" />
        </button>
      </section>
    </main>

    <footer class="payment-footer">
      <div>
        <span>合计</span>
        <strong>¥{{ payableAmount.toFixed(2) }}</strong>
      </div>
      <button type="button" :disabled="isPaying || !canSubmit" @click="pay">
        {{ isPaying ? '正在跳转支付宝...' : '确认支付' }}
      </button>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.payment-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #222;
  padding-bottom: 76px;
}

.payment-content {
  padding: 12px;
}

.amount-panel {
  background: linear-gradient(135deg, #1677ff, #19be6b);
  color: #fff;
  padding: 24px 16px;
  border-radius: 8px;
  text-align: center;
}

.amount-label {
  font-size: 13px;
  opacity: 0.9;
}

.amount-value {
  display: block;
  margin-top: 8px;
  font-size: 34px;
  line-height: 1.15;
}

.shop-name {
  margin-top: 8px;
  font-size: 14px;
}

.order-card,
.method-card {
  margin-top: 12px;
  background: #fff;
  border-radius: 8px;
  padding: 14px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.empty-tip {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff7e6;
  color: #d46b08;
  font-size: 13px;
  line-height: 1.5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 30px;
  font-size: 14px;
  color: #666;

  span:last-child {
    color: #222;
  }
}

.method-item {
  width: 100%;
  min-height: 62px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fff;
  padding: 10px;
  margin-top: 10px;
  text-align: left;

  &.active {
    border-color: #1677ff;
    background: #f2f8ff;

    .method-check {
      border-color: #1677ff;
      background: #1677ff;

      &::after {
        opacity: 1;
      }
    }
  }
}

.method-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 50%;
  background: #eef7ff;
  color: #1677ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.method-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 15px;
    color: #222;
  }

  small {
    font-size: 12px;
    color: #8a8f99;
  }
}

.method-check {
  width: 18px;
  height: 18px;
  border: 1px solid #c9ced6;
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 2px;
    width: 5px;
    height: 9px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    opacity: 0;
  }
}

.payment-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  background: #fff;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  z-index: 20;

  span {
    display: block;
    color: #777;
    font-size: 12px;
  }

  strong {
    color: #ff4d4f;
    font-size: 20px;
  }

  button {
    width: 156px;
    height: 44px;
    border: 0;
    border-radius: 6px;
    background: #19be6b;
    color: #fff;
    font-size: 16px;
    font-weight: 700;

    &:disabled {
      opacity: 0.7;
    }
  }
}
</style>
