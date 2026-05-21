<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  selectedSpecs: {
    type: Object,
    default: () => ({}),
  },
  totalPrice: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['add-cart', 'buy-now'])

const buttonStyle = computed(() => ({
  '--theme-color': props.config.ui.themeColor || '#FF6B6B',
}))

const handleAddCart = () => emit('add-cart')
const handleBuyNow = () => emit('buy-now')
</script>

<template>
  <div class="specs-footer">
    <div class="footer-left">
      <div class="total-price">
        <span class="label">合计:</span>
        <span class="price">
          <span class="currency">¥</span>
          <span class="amount">{{ totalPrice }}</span>
        </span>
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn btn-add-cart" :style="buttonStyle" @click="handleAddCart">
        加入购物车
      </button>
      <button class="btn btn-buy-now" :style="buttonStyle" @click="handleBuyNow">
        立即购买
      </button>
    </div>
  </div>
</template>

<style scoped>
.specs-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #EEE;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.footer-left {
  flex: 1;
}

.total-price .label {
  font-size: 14px;
  color: #666;
}

.total-price .price {
  margin-left: 4px;
}

.total-price .currency {
  font-size: 14px;
  color: #FF4D4F;
  font-weight: 600;
}

.total-price .amount {
  font-size: 22px;
  color: #FF4D4F;
  font-weight: 700;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-cart {
  background: #FFF0F0;
  color: var(--theme-color);
}

.btn-buy-now {
  background: var(--theme-color);
  color: #fff;
}

.btn:active {
  transform: scale(0.98);
}
</style>
