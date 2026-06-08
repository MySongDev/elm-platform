<script setup>
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
  <footer class="cart-bottom">
    <div class="bottom-summary">
      <button class="select-all" type="button" @click="emit('toggle-all')">
        <CartCheckButton :checked="allSelected" as-span />
        <span class="select-label">全选</span>
      </button>

      <div v-if="!manageMode" class="total-price">
        <span class="total-label">合计</span>
        <span class="currency">¥</span>
        <strong>{{ total }}</strong>
      </div>
    </div>

    <button class="action-button" :class="{ active: selectedCount > 0, danger: manageMode }" type="button"
      :disabled="selectedCount === 0" @click="emit(manageMode ? 'remove' : 'checkout')">
      {{ manageMode ? '删除' : '去结算' }}
    </button>
  </footer>
</template>

<style lang="scss" scoped>
.cart-bottom {
  position: fixed;
  right: 0;
  bottom: var(--van-tabbar-height, 50px);
  left: 0;
  z-index: 20;
  display: flex;
  gap: 14px;
  align-items: center;
  height: calc(60px + env(safe-area-inset-bottom));
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #e8eaef;
}

.bottom-summary {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.select-all {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 0;
  font-size: 14px;
  background: transparent;
  border: 0;
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
  margin-right: 4px;
  font-size: 13px;
}

.currency {
  font-size: 14px;
  font-weight: 700;
}

.total-price strong {
  margin-left: 2px;
  font-size: 26px;
  line-height: 1;
}

.action-button {
  width: 28vw;
  min-width: 100px;
  height: 40px;
  margin-left: auto;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: #c9c9c9;
  border: 0;
  border-radius: 999px;

  &.active {
    color: #3f4448;
    background: #ffd12f;
  }

  &.danger.active {
    color: #fff;
    background: #f04438;
  }
}
</style>
