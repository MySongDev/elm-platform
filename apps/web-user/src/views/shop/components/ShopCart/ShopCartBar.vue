<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { buildPaymentCartItems, savePaymentCheckoutDraft } from '@/utils/payment'

const props = defineProps({
  cartItems: {
    type: Array,
    default: () => [],
  },
  totalQty: Number,
  totalPrice: Number,
  minAmount: {
    type: Number,
    default: 20,
  },
  shopId: [String, Number],
  shopName: {
    type: String,
    default: '当前商家',
  },
  deliveryFee: {
    type: Number,
    default: 4,
  },
})

const emit = defineEmits(['add', 'decrease', 'clear'])

const router = useRouter()
const diffAmount = computed(() => Math.max(0, props.minAmount - props.totalPrice))
const showPanel = ref(false)

watch(
  () => props.totalQty,
  (qty) => {
    if (qty === 0)
      showPanel.value = false
  },
)

function togglePanel() {
  if (props.totalQty === 0)
    return
  showPanel.value = !showPanel.value
}

function closePanel() {
  showPanel.value = false
}

function getFoodPrice(item) {
  const spec = item.food.specfoods?.[item.specIndex]
  return spec?.price ?? 0
}

function checkout() {
  if (diffAmount.value > 0)
    return

  savePaymentCheckoutDraft({
    shopId: props.shopId,
    shopName: props.shopName,
    deliveryFee: Number(props.deliveryFee || 0),
    totalQty: props.totalQty,
    goodsAmount: Number(props.totalPrice || 0),
    cartItems: buildPaymentCartItems(props.cartItems),
  })

  router.push({
    name: 'ShopPayment',
    query: {
      shopid: props.shopId,
      shopName: props.shopName,
      amount: props.totalPrice.toFixed(2),
    },
  })
}
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="fade">
      <div v-if="showPanel && totalQty > 0" class="cart-overlay" @click="closePanel" />
    </Transition>

    <!-- 商品列表面板 -->
    <Transition name="slide-up">
      <div v-if="showPanel && totalQty > 0" class="cart-panel">
        <div class="panel-header">
          <span class="panel-title">已选商品</span>
          <button class="clear-btn" @click="emit('clear')">
            清空
          </button>
        </div>
        <div class="panel-list">
          <div v-for="item in cartItems" :key="`${item.food.item_id}-${item.specIndex}`" class="panel-item">
            <span class="item-name">{{ item.food.name }}</span>
            <div class="item-right">
              <span class="item-price">¥{{ (getFoodPrice(item) * item.qty).toFixed(2) }}</span>
              <div class="item-actions">
                <button class="act-btn decrease" @click="emit('decrease', item.food, item.specIndex)">
                  -
                </button>
                <span class="item-qty">{{ item.qty }}</span>
                <button class="act-btn increase" @click="emit('add', item.food, item.specIndex)">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 底部购物车栏 -->
    <div v-if="totalQty > 0" class="cart-bar-wrapper">
      <div class="cart-bar" @click="togglePanel">
        <div class="cart-icon-box" :class="{ active: totalQty > 0 }">
          <div v-if="totalQty > 0" class="badge">
            {{ totalQty }}
          </div>
          <span class="iconfont icon-cart">🛒</span>
        </div>

        <div class="price-info">
          <div class="main-price">
            ¥{{ totalPrice.toFixed(2) }}
          </div>
          <div class="sub-fee">
            另需配送费约 ¥{{ Number(deliveryFee || 0).toFixed(2) }}
          </div>
        </div>

        <button class="submit-btn" :class="{ ready: diffAmount === 0 }" :disabled="diffAmount > 0"
          @click.stop="checkout">
          {{ diffAmount > 0 ? `还差 ¥${diffAmount.toFixed(1)} 起送` : '去结算' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style src="./ShopCartBar.scss" lang="scss" scoped></style>
