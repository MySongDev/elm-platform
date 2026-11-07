<script setup>
/**
 * 底部购物车条（纯展示 + 发 checkout 事件）。
 *
 * ⚠️ 与 web-user ShopCartBar.vue 的差异：web-user 那条带「展开商品清单弹层 +
 * 清空」，本次重设计只做美团式单行条（图标角标 + 合计 + 起送提示/去结算）。
 * 清单编辑入口在 cart tabBar 页已有，不在 shop 页重复做。
 * 结算动作（写草稿 + 跳 payment）由页面处理：本组件只判「能不能结算」，
 * 不持有 shopId/商品清单，避免把页面数据整包透传进来。
 */
import { computed } from 'vue'

import { showToast } from '@/platform/feedback'

const props = defineProps({
  totalQty: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  minAmount: {
    type: Number,
    default: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['checkout'])

const gap = computed(() => props.minAmount - props.totalPrice)
const canCheckout = computed(() => props.totalQty > 0 && gap.value <= 0)

// 按钮文案与点击反馈。
// ⚠️ 刻意不在模板里写三元 + toFixed：小程序端模板表达式每次重渲染都重跑，
// 且箭头函数/方法调用在 wxml 里要编译成事件代理，收敛到 script 更稳
const btnText = computed(() => (gap.value > 0 ? `¥${gap.value.toFixed(2)} 起送` : '去结算'))

function onCheckoutTap() {
  if (canCheckout.value) {
    emit('checkout')
    return
  }
  showToast(props.totalQty > 0 ? `还差 ¥${gap.value.toFixed(2)} 起送` : '请先选购商品')
}
</script>

<template>
  <view class="cart-bar">
    <view class="cart-bar__left">
      <view class="cart-bar__icon">
        <SvgIcon icon-name="cart-icon" class="cart-bar__svg" />
        <text v-if="totalQty > 0" class="cart-bar__badge">
          {{ totalQty }}
        </text>
      </view>
      <view class="cart-bar__price">
        <template v-if="totalQty > 0">
          <text class="cart-bar__total">
            ¥{{ totalPrice.toFixed(2) }}
          </text>
          <text class="cart-bar__fee">
            另需配送费 ¥{{ deliveryFee }}
          </text>
        </template>
        <text v-else class="cart-bar__empty">
          未选购商品
        </text>
      </view>
    </view>

    <view
      class="cart-bar__btn"
      :class="{ 'is-active': canCheckout }"
      @click="onCheckoutTap"
    >
      <text>{{ btnText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cart-bar {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  left: 24rpx;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 96rpx;
  padding: 0 8rpx 0 20rpx;
  background: #404040;
  border-radius: 48rpx;
}

.cart-bar__left {
  display: flex;
  gap: 16rpx;
  align-items: center;
  min-width: 0;
}

.cart-bar__icon {
  position: relative;
}

/* ⚠️ 标签级 class + font-size（SvgIcon 契约）：cart-icon 是多色 PNG 分支，1em 见宽 */
.cart-bar__svg {
  font-size: 56rpx;
  line-height: 1;
}

.cart-bar__badge {
  position: absolute;
  top: -8rpx;
  right: -12rpx;
  min-width: 32rpx;
  padding: 0 6rpx;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 32rpx;
  color: #fff;
  text-align: center;
  background: #fb4e44;
  border-radius: 16rpx;
}

.cart-bar__price {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  min-width: 0;
}

.cart-bar__total {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}

.cart-bar__fee,
.cart-bar__empty {
  font-size: 20rpx;
  color: #bbb;
}

.cart-bar__btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  padding: 0 36rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #999;
  background: #2b2b2b;
  border-radius: 40rpx;

  &.is-active {
    color: #333;
    background: #ffd600;
  }
}
</style>
