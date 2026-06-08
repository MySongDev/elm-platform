<script setup>
import { computed, inject, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { showAlert } from '@/components/common/AlterTip'
import { confirm } from '@/components/common/ConfirmDialog'
import { navbarHeaderContextKey } from '@/layout/navbarHeaderContext'
import { savePaymentCheckoutDraft } from '@/untils/payment'

import CartBottomBar from './components/CartBottomBar.vue'
import CartStoreCard from './components/CartStoreCard.vue'
import { useCartDetail } from './composables/useCartDetail'

defineOptions({
  name: 'CartDetail',
})

const router = useRouter()
const {
  stores,
  hasItems,
  selectedCount,
  selectedQuantity,
  selectedTotal,
  totalCount,
  allSelected,
  checkoutItems,
  selectedProducts,
  isStoreSelected,
  toggleAll,
  toggleStore,
  toggleProduct,
  increaseQuantity,
  decreaseQuantity,
  removeSelected,
  markPendingCheckout,
} = useCartDetail()

const manageMode = ref(false)
const title = computed(() => `购物车 (${totalCount.value})`)
const displayTotal = computed(() => Math.round(selectedTotal.value))
const navbarHeader = inject(navbarHeaderContextKey, null)

function syncNavbarHeader() {
  navbarHeader?.setHeader({
    title: title.value,
    editLabel: manageMode.value ? '完成' : '管理',
    onEdit: toggleManageMode,
  })
}

function toggleManageMode() {
  if (!hasItems.value) {
    showAlert('购物车还是空的')
    return
  }

  manageMode.value = !manageMode.value
}

function checkout() {
  if (selectedCount.value === 0) {
    showAlert('请选择需要结算的商品')
    return
  }

  const checkoutProductIds = selectedProducts.value.map(product => product.id)
  markPendingCheckout(checkoutProductIds)

  savePaymentCheckoutDraft({
    shopId: 'cart-checkout',
    shopName: selectedCount.value > 1 ? '购物车合并结算' : checkoutItems.value[0]?.shopName || '购物车结算',
    deliveryFee: 0,
    totalQty: selectedQuantity.value,
    goodsAmount: Number(selectedTotal.value || 0),
    cartItems: checkoutItems.value,
    source: 'cart',
    cartProductIds: checkoutProductIds,
  })

  router.push({
    name: 'ShopPayment',
    query: {
      source: 'cart',
      amount: selectedTotal.value.toFixed(2),
    },
  })
}

async function removeSelectedProducts() {
  if (selectedCount.value === 0) {
    showAlert('请选择要删除的商品')
    return
  }

  const confirmed = await confirm({
    title: `删除已选的 ${selectedCount.value} 件商品？`,
    confirmText: '删除',
  })

  if (!confirmed)
    return

  removeSelected()
  if (!hasItems.value)
    manageMode.value = false
}

watch([title, manageMode], syncNavbarHeader, { immediate: true })

onActivated(syncNavbarHeader)
onDeactivated(() => navbarHeader?.clearHeader())
onBeforeUnmount(() => navbarHeader?.clearHeader())
</script>

<template>
  <section class="cart-page">
    <main class="cart-content">
      <template v-if="hasItems">
        <CartStoreCard v-for="store in stores" :key="store.id" :store="store" :selected="isStoreSelected(store)"
          @toggle-store="toggleStore" @toggle-product="toggleProduct" @increase="increaseQuantity"
          @decrease="decreaseQuantity" />
      </template>

      <van-empty v-else class="cart-empty" image="shopping-cart-o" description="购物车还是空的">
        <van-button round type="primary" size="small" @click="router.push('/msite')">
          去逛逛
        </van-button>
      </van-empty>
    </main>

    <CartBottomBar :total="displayTotal" :all-selected="allSelected" :selected-count="selectedCount"
      :manage-mode="manageMode" @toggle-all="toggleAll" @checkout="checkout" @remove="removeSelectedProducts" />
  </section>
</template>

<style lang="scss" scoped>
.cart-page {
  --cart-bottom-safe: calc(168px + env(safe-area-inset-bottom));

  min-height: 100vh;
  padding-bottom: var(--cart-bottom-safe);
  margin: 0 auto;
  color: #444;
  background: $ff;
}

.cart-content {
  padding: 10px 8px var(--cart-bottom-safe);
}

.cart-empty {
  padding-top: 18vh;
}
</style>
