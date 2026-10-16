<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/cart/components/CartBottomBar.vue 同源改造。
 * 差异：
 * 1. footer/button → view（小程序 button 默认样式重置成本高）
 * 2. ★ **bottom 定位基准变了**：web-user 是 `bottom: var(--van-tabbar-height, 50px)`
 *    （悬浮在 Vant tabbar 之上）；uni-user 用**原生 tabBar**，它不在页面 DOM 里，
 *    页面内容区本身就在 tabBar 之上 → `bottom: 0` 即可，不需要 50px 偏移。
 *    ⚠️ 这是 tabBar 范式差异的连带修正，不是视觉调整。
 * 3. `height: calc(60px + env(safe-area-inset-bottom))` → ⑤ 类 calc：px 转 rpx、env 保留
 * 4. ① 类不转：border-top 1px
 * 5. `28vw` → 210rpx（vw×7.5）
 */
import CartCheckButton from './CartCheckButton.vue'

defineProps({
  total: {
    type: Number,
    default: 0,
  },
  allSelected: {
    type: Boolean,
    default: false,
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  manageMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-all', 'checkout', 'remove'])
</script>

<template>
  <view class="cart-bottom">
    <view class="bottom-summary">
      <view
        class="select-all"
        @click="emit('toggle-all')"
      >
        <CartCheckButton
          :checked="allSelected"
          as-span
        />
        <text class="select-label">
          全选
        </text>
      </view>

      <view
        v-if="!manageMode"
        class="total-price"
      >
        <text class="total-label">
          合计
        </text>
        <text class="currency">
          ¥
        </text>
        <text class="total-value">
          {{ total }}
        </text>
      </view>
    </view>

    <view
      class="action-button"
      :class="{ active: selectedCount > 0, danger: manageMode, disabled: selectedCount === 0 }"
      @click="selectedCount > 0 && emit(manageMode ? 'remove' : 'checkout')"
    >
      {{ manageMode ? '删除' : '去结算' }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cart-bottom {
  position: fixed;
  right: 0;

  /* ★ 原生 tabBar 不在页面 DOM 内，页面内容区已在 tabBar 之上 → bottom: 0
     （web-user 的 var(--van-tabbar-height, 50px) 偏移作废，见文件头第 2 条） */
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  gap: 28rpx;
  align-items: center;

  /* ⑤ 类 calc：px 转 rpx、env() 保留 */
  height: calc(120rpx + env(safe-area-inset-bottom));
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #e8eaef; /* ① 类 border 不转 */
}

.bottom-summary {
  display: flex;
  gap: 20rpx;
  align-items: center;
  min-width: 0;
}

.select-all {
  display: inline-flex;
  gap: 16rpx;
  align-items: center;
  padding: 0;
  font-size: 28rpx;
  background: transparent;
}

.select-label {
  line-height: 1;
}

.total-price {
  display: flex;
  align-items: baseline;
  min-width: 0;
}

.total-label {
  margin-right: 8rpx;
  font-size: 26rpx;
}

.currency {
  font-size: 28rpx;
  font-weight: 700;
}

.total-value {
  margin-left: 4rpx;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1;
}

.action-button {
  width: 210rpx; /* 28vw × 7.5 */
  min-width: 200rpx;
  height: 80rpx;
  margin-left: auto;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 80rpx;
  color: #fff;
  text-align: center;
  background: #c9c9c9;
  border-radius: 999rpx;

  &.active {
    color: #3f4448;
    background: #ffd12f;
  }

  &.danger.active {
    color: #fff;
    background: #f04438;
  }

  &.disabled {
    opacity: 0.6;
  }
}
</style>
