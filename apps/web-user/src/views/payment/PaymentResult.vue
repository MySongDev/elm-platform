<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip'
import { getAlipayPaymentStatus } from '@/services/api/api-payment'
import { useCartStore } from '@/stores/modules/store-cart'
import { savePaymentSuccessContext } from '@/untils/payment'

defineOptions({
  name: 'PaymentResult',
})

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const loading = ref(true)
const order = ref(null)
let timer = null

const orderNo = route.query.orderNo

async function fetchStatus(refresh = true) {
  if (!orderNo)
    return

  if (timer) {
    window.clearTimeout(timer)
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
      timer = window.setTimeout(fetchStatus, 2500, true)
  }
  catch (error) {
    showAlert(error?.message || '查询支付结果失败')
  }
  finally {
    loading.value = false
  }
}

function backToNextPage() {
  if (order.value?.status === 'PAID') {
    router.replace({
      path: '/order',
      query: {
        paid: '1',
        orderNo: order.value.orderNo,
      },
    })
    return
  }

  if (order.value?.shopId) {
    router.replace({
      path: '/shop',
      query: {
        shopid: order.value.shopId,
        paid: '1',
        orderNo: order.value.orderNo,
      },
    })
    return
  }

  router.replace('/home')
}

onMounted(() => {
  fetchStatus(route.query.pending !== '0')
})

onBeforeUnmount(() => {
  if (timer)
    window.clearTimeout(timer)
})
</script>

<template>
  <div class="payment-result-page">
    <head-top head-title="支付结果" />

    <main class="result-content">
      <template v-if="loading">
        <div class="status-icon pending">
          ...
        </div>
        <h2>正在确认支付结果</h2>
        <p>请稍候，我们正在和支付宝同步订单状态。</p>
      </template>

      <template v-else-if="order?.status === 'PAID'">
        <div class="status-icon success">
          ✓
        </div>
        <h2>支付成功</h2>
        <p>{{ order.shopName }} 的订单已支付，商家正在为你备餐。</p>
        <p class="order-meta">
          订单号：{{ order.orderNo }}
        </p>
      </template>

      <template v-else-if="order?.status === 'CLOSED'">
        <div class="status-icon closed">
          !
        </div>
        <h2>订单已关闭</h2>
        <p>该订单未完成支付或已关闭，请返回商家页重新下单。</p>
      </template>

      <template v-else>
        <div class="status-icon pending">
          ...
        </div>
        <h2>等待支付完成</h2>
        <p>如果你已经完成支付，请稍等几秒后重新查询。</p>
      </template>

      <div v-if="order" class="result-card">
        <div class="row">
          <span>订单编号</span>
          <strong>{{ order.orderNo }}</strong>
        </div>
        <div class="row">
          <span>支付金额</span>
          <strong>¥{{ Number(order.payableAmount || 0).toFixed(2) }}</strong>
        </div>
        <div class="row">
          <span>交易状态</span>
          <strong>{{ order.tradeStatus }}</strong>
        </div>
      </div>

      <div class="actions">
        <button class="btn secondary" type="button" @click="fetchStatus(true)">
          重新查询
        </button>
        <button class="btn primary" type="button" @click="backToNextPage">
          {{ order?.status === 'PAID' ? '查看订单' : order?.shopId ? '返回商家' : '返回首页' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.payment-result-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f5f9 100%);
}

.result-content {
  min-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 40px;
  text-align: center;
}

.status-icon {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 700;
  color: #fff;

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

h2 {
  margin-top: 18px;
  font-size: 24px;
  color: #1f2329;
}

p {
  margin-top: 10px;
  line-height: 1.7;
  color: #5b6573;
  font-size: 14px;
}

.order-meta {
  color: #8a94a3;
}

.result-card {
  width: 100%;
  margin-top: 24px;
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(22, 119, 255, 0.08);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  color: #5b6573;
  font-size: 14px;

  strong {
    color: #1f2329;
    font-size: 14px;
  }
}

.actions {
  width: 100%;
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  height: 44px;
  border-radius: 999px;
  border: 0;
  font-size: 15px;
  font-weight: 700;

  &.primary {
    background: #1677ff;
    color: #fff;
  }

  &.secondary {
    background: #eaf2ff;
    color: #1677ff;
  }
}
</style>
