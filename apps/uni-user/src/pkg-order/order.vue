<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/order/order.vue 同源改造（最近订单列表页）。
 * 整体替换占位页（Batch 3 order 组）。
 *
 * 差异：
 * 1. vue-router（`route.query`/`route.fullPath`/`useRouter`）→ 小程序端：
 *    - 取 query 用 `onLoad(options)` + `@/platform/navigation` 的
 *      `getCurrentFullPath()`/`stripQuery`（页面栈栈顶）
 *    - 跳登录 `router.push({path:'/login',query:{redirect}})` →
 *      `redirectToLogin()`（platform/navigation 已封装回跳逻辑）
 *    - `router.push('/msite')`（tabBar 页）→ `navigateTo(ROUTES.MSITE)`（内部自动 switchTab）
 *    - `onActivated`（keep-alive 场景）→ `onShow`（小程序无 keep-alive，每次进入 onShow）
 *    - `watch(() => route.query.orderNo)` → 小程序无 query watch，改为 onShow 时重新拉列表
 *      （订单页通过 continuePayment/PaymentResult 跳进来带 orderNo，进页即刷新已足够）
 * 2. `showAlert`（AlterTip DOM）→ platform/feedback showToast
 * 3. `van-loading`/`van-empty`/`van-dialog`（vant）→
 *    BaseState 的 loading/empty slot（uni-user 已有 DefaultLoading/DefaultEmpty）；
 *    退款 dialog 用 platform/feedback showConfirm + 输入框降级
 * 4. **退款弹窗降级**：web-user 的 van-dialog 里嵌 van-field textarea（可输入退款原因），
 *    小程序端 showConfirm 是原生弹窗、不支持嵌输入框 → 改用 uni.showModal 前先用
 *    `uni.showActionSheet` 不行（不支持输入），最终改为：点「申请退款」弹一个
 *    自绘的 `<view>` 模态（v-if + 输入框 + 提交），见下方 RefundDialog。
 *    ⚠️ 这是本次刻意保留的 DOM 级交互降级，功能等价（输入原因 + 提交/取消）。
 * 5. px → rpx；`calc(var(--van-tabbar-height))` 删除（小程序无 tabbar 变量）
 */
import { onLoad, onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import { navigateTo, redirectToLogin, ROUTES } from '@/platform/navigation'

import { useUserStore } from '@/stores/modules/store-user'
import OrderCard from './components/OrderCard.vue'
import { useContinuePayment } from './composables/useContinuePayment'
import { useRequestRefund } from './composables/useRequestRefund'
import { useUserOrders } from './composables/useUserOrders'

const userStore = useUserStore()
const { isLogin: isAuthenticated } = storeToRefs(userStore)

// 高亮订单号：从 query.orderNo 读（onLoad 传入）
const highlightedOrderNo = ref('')

const {
  orders,
  loading,
  error,
  hasLoaded,
  fetchOrders,
} = useUserOrders(isAuthenticated, { limit: 20 })

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
  redirectToLogin()
}

function goMsite() {
  navigateTo(ROUTES.MSITE)
}

function retryFetch() {
  fetchOrders()
}

const { continuePayment } = useContinuePayment({
  isLoggedIn: isAuthenticated,
  fetchOrders,
  goLogin,
})

const { requestRefund } = useRequestRefund({
  fetchOrders,
})

// ── 退款弹窗（自绘模态，降级 vant van-dialog）─────────────────────
const refundDialogVisible = shallowRef(false)
const refundReason = shallowRef('')
const pendingRefundOrder = shallowRef(null)
const refundSubmitting = ref(false)

function openRefundDialog(order) {
  pendingRefundOrder.value = order
  refundReason.value = ''
  refundDialogVisible.value = true
}

function closeRefundDialog() {
  refundDialogVisible.value = false
  pendingRefundOrder.value = null
  refundReason.value = ''
}

async function submitRefund() {
  if (!pendingRefundOrder.value || refundSubmitting.value)
    return

  refundSubmitting.value = true
  const success = await requestRefund(pendingRefundOrder.value, refundReason.value)
  refundSubmitting.value = false
  if (success)
    closeRefundDialog()
}

// 高亮订单号：continuePayment / PaymentResult 跳进来时带 orderNo（onLoad options 传入）
// 小程序用 onLoad(options) 取 query，对齐 web-user 的 `route.query.orderNo`
onLoad((options) => {
  highlightedOrderNo.value = String(options?.orderNo || '')
})

// 每次进入页面刷新（小程序无 keep-alive，onShow 是二次进入的唯一时机，
// 对齐 web-user 的 onActivated + watch(route.query.orderNo)）
onShow(() => {
  if (isAuthenticated.value)
    fetchOrders()
})
</script>

<template>
  <view class="order-page">
    <view v-if="!isAuthenticated" class="order-state">
      <view class="state-visual login" />
      <text class="state-title">
        登录后查看订单
      </text>
      <text class="state-desc">
        当前账号的支付订单会在这里同步展示。
      </text>
      <view class="primary-button" @click="goLogin">
        登录/注册
      </view>
    </view>

    <template v-else>
      <view class="order-header">
        <view>
          <text class="order-title">
            最近订单
          </text>
          <text class="order-subtitle">
            最近创建与支付
          </text>
        </view>
        <view
          class="refresh-button"
          :class="{ 'is-disabled': loading }"
          @click="!loading && retryFetch()"
        >
          {{ loading ? '刷新中' : '刷新' }}
        </view>
      </view>

      <BaseState :state="orderState" @retry="retryFetch">
        <template #loading>
          <view class="order-state">
            <LocalLoading />
            <text class="state-desc">
              正在加载订单
            </text>
          </view>
        </template>

        <template #error>
          <view class="order-state">
            <view class="state-visual error" />
            <text class="state-title">
              订单加载失败
            </text>
            <text class="state-desc">
              {{ error }}
            </text>
            <view class="primary-button" @click="retryFetch">
              重新加载
            </view>
          </view>
        </template>

        <template #empty>
          <view class="order-state">
            <text class="state-desc">
              暂无支付订单
            </text>
            <view class="primary-button" @click="goMsite">
              去点餐
            </view>
          </view>
        </template>

        <view class="order-list">
          <OrderCard
            v-for="order in orders"
            :key="order.orderNo"
            :order="order"
            :highlight="order.orderNo === highlightedOrderNo"
            @continue-payment="continuePayment"
            @request-refund="openRefundDialog"
          />
        </view>
      </BaseState>
    </template>

    <!-- 退款原因弹窗（自绘，降级 vant van-dialog） -->
    <view v-if="refundDialogVisible" class="refund-dialog-mask" @click.stop="closeRefundDialog">
      <view class="refund-dialog" @click.stop>
        <view class="refund-dialog_title">
          申请退款
        </view>
        <textarea
          v-model="refundReason"
          class="refund-dialog_input"
          maxlength="80"
          placeholder="请输入退款原因（不少于 2 个字）"
        />
        <view class="refund-dialog_actions">
          <view class="refund-dialog_btn cancel" @click="closeRefundDialog">
            取消
          </view>
          <view
            class="refund-dialog_btn confirm"
            :class="{ 'is-disabled': refundSubmitting }"
            @click="submitRefund"
          >
            {{ refundSubmitting ? '提交中...' : '提交申请' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.order-page {
  min-height: 100%;
  padding: 24rpx;
  background: #f5f7fa;
}

.order-header {
  display: flex;
  gap: 24rpx;
  align-items: center;
  justify-content: space-between;
  min-height: 116rpx;
  margin-bottom: 20rpx;
}

.order-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.3;
  color: #1f2329;
}

.order-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.4;
  color: #8a8f99;
}

.refresh-button,
.primary-button {
  font-size: 28rpx;
  font-weight: 700;
  border-radius: 12rpx;
}

.refresh-button {
  flex: 0 0 auto;
  height: 68rpx;
  padding: 0 28rpx;
  line-height: 68rpx;
  color: #1677ff;
  text-align: center;
  background: #eaf2ff;

  &.is-disabled {
    opacity: 0.7;
  }
}

.primary-button {
  min-width: 224rpx;
  height: 84rpx;
  padding: 0 36rpx;
  line-height: 84rpx;
  color: #222;
  text-align: center;
  background: #ffdd1f;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 56rpx 36rpx;
  text-align: center;
}

.state-visual {
  position: relative;
  width: 176rpx;
  height: 176rpx;
  margin-bottom: 32rpx;
  border-radius: 50%;

  &.login {
    background: linear-gradient(135deg, #dbeafe, #19be6b);
  }

  &.error {
    background: linear-gradient(135deg, #ffe1de, #ff8a65);
  }
}

.state-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.4;
  color: #1f2329;
}

.state-desc {
  display: block;
  max-width: 560rpx;
  margin: 16rpx 0 36rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #8a8f99;
}

/* ── 退款弹窗 ── */
.refund-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 50%);
}

.refund-dialog {
  width: 90%;
  max-width: 640rpx;
  padding: 32rpx;
  text-align: center;
  background: #fff;
  border-radius: 20rpx;

  &_title {
    margin-bottom: 24rpx;
    font-size: 36rpx;
    font-weight: 700;
  }

  &_input {
    box-sizing: border-box;
    width: 100%;
    height: 160rpx;
    padding: 16rpx;
    font-size: 28rpx;
    color: #333;
    background: #f5f5f5;
    border: 2rpx solid #e4e4e4;
    border-radius: 12rpx;
  }

  &_actions {
    display: flex;
    gap: 24rpx;
    margin-top: 24rpx;
  }

  &_btn {
    flex: 1;
    height: 80rpx;
    font-size: 30rpx;
    line-height: 80rpx;
    text-align: center;
    border-radius: 12rpx;

    &.cancel {
      color: #222;
      background: #f0f0f0;
    }

    &.confirm {
      color: #fff;
      background: #d8584a;

      &.is-disabled {
        opacity: 0.6;
      }
    }
  }
}
</style>
