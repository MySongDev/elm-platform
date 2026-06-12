<script setup>
import { storeToRefs } from 'pinia'
import { computed, onActivated, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseState from '@/components/common/BaseState/BaseState.vue'
import { useUserStore } from '@/stores/modules/store-user'
import { getStore } from '@/utils/storage/storage'
import OrderCard from './components/OrderCard.vue'
import { useContinuePayment } from './composables/useContinuePayment'
import { useRequestRefund } from './composables/useRequestRefund'
import { useUserOrders } from './composables/useUserOrders'

defineOptions({
  name: 'Order',
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { isLogin, userId } = storeToRefs(userStore)

const currentUserId = computed(() => String(userId.value || getStore('user_id') || ''))
const isAuthenticated = computed(() => Boolean(isLogin.value || currentUserId.value))
const highlightedOrderNo = computed(() => String(route.query.orderNo || ''))

const {
  orders,
  loading,
  error,
  hasLoaded,
  fetchOrders,
} = useUserOrders(currentUserId, { limit: 20 })

const hasOrders = computed(() => orders.value.length > 0)
const isInitialLoading = computed(() => loading.value && !hasLoaded.value)
const orderState = computed(() => {
  if (isInitialLoading.value)
    return 'loading'

  if (error.value)
    return 'error'

  if (!hasOrders.value)
    return 'empty'

  return 'success'
})

function goLogin() {
  router.push({
    path: '/login',
    query: { redirect: route.fullPath },
  })
}

function goMsite() {
  router.push('/msite')
}

function retryFetch() {
  fetchOrders()
}

const { continuePayment } = useContinuePayment({
  currentUserId,
  fetchOrders,
  goLogin,
})

const { requestRefund } = useRequestRefund({
  fetchOrders,
})

const refundDialogVisible = shallowRef(false)
const refundReason = shallowRef('')
const pendingRefundOrder = shallowRef(null)

function resetRefundDialog() {
  refundReason.value = ''
  pendingRefundOrder.value = null
}

function openRefundDialog(order) {
  pendingRefundOrder.value = order
  refundReason.value = ''
  refundDialogVisible.value = true
}

async function handleRefundDialogClose(action) {
  if (action === 'cancel') {
    resetRefundDialog()
    return true
  }

  if (!pendingRefundOrder.value)
    return true

  const success = await requestRefund(pendingRefundOrder.value, refundReason.value)

  if (success)
    resetRefundDialog()

  return success
}

onActivated(() => {
  if (isAuthenticated.value)
    fetchOrders()
})

watch(
  () => route.query.orderNo,
  () => {
    if (isAuthenticated.value)
      fetchOrders()
  },
)
</script>

<template>
  <section class="order-page">
    <div v-if="!isAuthenticated" class="order-state">
      <div class="state-visual login" aria-hidden="true" />
      <p class="state-title">
        登录后查看订单
      </p>
      <p class="state-desc">
        当前账号的支付订单会在这里同步展示。
      </p>
      <button class="primary-button" type="button" @click="goLogin">
        登录/注册
      </button>
    </div>

    <template v-else>
      <header class="order-header">
        <div>
          <h2 class="order-title">
            最近订单
          </h2>
          <p class="order-subtitle">
            最近创建与支付
          </p>
        </div>
        <button class="refresh-button" type="button" :disabled="loading" @click="retryFetch">
          {{ loading ? '刷新中' : '刷新' }}
        </button>
      </header>

      <BaseState class="order-state-host" :state="orderState" @retry="retryFetch">
        <template #loading>
          <div class="order-state">
            <van-loading size="28px" color="#1677ff" />
            <p class="state-desc">
              正在加载订单
            </p>
          </div>
        </template>

        <template #error>
          <div class="order-state">
            <div class="state-visual error" aria-hidden="true" />
            <p class="state-title">
              订单加载失败
            </p>
            <p class="state-desc">
              {{ error }}
            </p>
            <button class="primary-button" type="button" @click="retryFetch">
              重新加载
            </button>
          </div>
        </template>

        <template #empty>
          <div class="order-state">
            <van-empty description="暂无支付订单" />
            <button class="primary-button" type="button" @click="goMsite">
              去点餐
            </button>
          </div>
        </template>

        <div class="order-list">
          <OrderCard
            v-for="order in orders"
            :key="order.orderNo"
            :order="order"
            :highlight="order.orderNo === highlightedOrderNo"
            @continue-payment="continuePayment"
            @request-refund="openRefundDialog"
          />
        </div>
      </BaseState>
    </template>

    <van-dialog
      v-model:show="refundDialogVisible"
      title="申请退款"
      show-cancel-button
      confirm-button-text="提交申请"
      cancel-button-text="取消"
      :before-close="handleRefundDialogClose"
    >
      <div class="refund-dialog">
        <van-field
          v-model="refundReason"
          rows="3"
          autosize
          type="textarea"
          maxlength="80"
          show-word-limit
          placeholder="请输入退款原因"
        />
      </div>
    </van-dialog>
  </section>
</template>

<style lang="scss" scoped>
.order-page {
  min-height: 100%;
  padding: 12px 12px calc(var(--van-tabbar-height) + 18px);
  background: #f5f7fa;
}

.order-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  margin-bottom: 10px;
}

.order-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
  color: #1f2329;
}

.order-subtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #8a8f99;
}

.refresh-button,
.primary-button {
  font-size: 14px;
  font-weight: 700;
  border: 0;
  border-radius: 6px;
}

.refresh-button {
  flex: 0 0 auto;
  height: 34px;
  padding: 0 14px;
  color: #1677ff;
  background: #eaf2ff;

  &:disabled {
    opacity: 0.7;
  }
}

.primary-button {
  min-width: 112px;
  height: 42px;
  padding: 0 18px;
  color: #222;
  background: #ffdd1f;
}

.refund-dialog {
  padding: 10px 16px 16px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-state-host,
.order-state {
  min-height: calc(100vh - 34vw - var(--van-tabbar-height));
}

.order-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 18px;
  text-align: center;
}

.state-visual {
  position: relative;
  width: 88px;
  height: 88px;
  margin-bottom: 16px;
  border-radius: 50%;

  &::before,
  &::after {
    position: absolute;
    content: '';
    background: #fff;
    border-radius: 4px;
  }

  &::before {
    top: 24px;
    right: 22px;
    left: 22px;
    height: 10px;
  }

  &::after {
    top: 44px;
    right: 34px;
    left: 22px;
    height: 10px;
  }

  &.login {
    background: linear-gradient(135deg, #dbeafe, #19be6b);
  }

  &.error {
    background: linear-gradient(135deg, #ffe1de, #ff8a65);
  }
}

.state-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  color: #1f2329;
}

.state-desc {
  max-width: 280px;
  margin: 8px 0 18px;
  font-size: 14px;
  line-height: 1.6;
  color: #8a8f99;
}
</style>
