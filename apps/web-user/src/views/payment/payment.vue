<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip'
import { createAlipayWapPayment } from '@/services/api/api-payment'
import { useUserStore } from '@/stores/modules/store-user'
import { clearPaymentCheckoutDraft, getPaymentCheckoutDraft } from '@/utils/payment'
import { getStore } from '@/utils/storage/storage'

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
  padding-bottom: 76px;
  color: #222;
  background: #f5f7fa;
}

.payment-content {
  padding: 12px;
}

.amount-panel {
  padding: 24px 16px;
  color: #fff;
  text-align: center;
  background: linear-gradient(135deg, #1677ff, #19be6b);
  border-radius: 8px;
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
  padding: 14px;
  margin-top: 12px;
  background: #fff;
  border-radius: 8px;
}

.card-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
}

.empty-tip {
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #d46b08;
  background: #fff7e6;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 30px;
  font-size: 14px;
  color: #666;

  span:last-child {
    color: #222;
  }
}

.method-item {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 62px;
  padding: 10px;
  margin-top: 10px;
  text-align: left;
  background: #fff;
  border: 1px solid #edf0f5;
  border-radius: 8px;

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
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-weight: 700;
  color: #1677ff;
  background: #eef7ff;
  border-radius: 50%;
}

.method-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

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
  position: relative;
  width: 18px;
  height: 18px;
  border: 1px solid #c9ced6;
  border-radius: 50%;

  &::after {
    position: absolute;
    top: 2px;
    left: 5px;
    width: 5px;
    height: 9px;
    content: '';
    border: solid #fff;
    border-width: 0 2px 2px 0;
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
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 8px 12px;
  background: #fff;
  box-shadow: 0 -4px 16px rgb(0 0 0 / 8%);

  span {
    display: block;
    font-size: 12px;
    color: #777;
  }

  strong {
    font-size: 20px;
    color: #ff4d4f;
  }

  button {
    width: 156px;
    height: 44px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    background: #19be6b;
    border: 0;
    border-radius: 6px;

    &:disabled {
      opacity: 0.7;
    }
  }
}
</style>
