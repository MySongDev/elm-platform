<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/cart/cart.vue 同源改造（tabBar 页）。
 *
 * 差异：
 * 1. **navbarHeaderContext 作废**：web-user 的「购物车 (N)」动态标题与「管理/完成」
 *    按钮挂在 NavbarLayout 的自定义导航头上（inject navbarHeaderContextKey）。
 *    小程序端 cart 是 tabBar 页 + 原生导航栏：
 *    - 动态标题 → `uni.setNavigationBarTitle`（原生导航栏支持动态改）
 *    - 「管理/完成」按钮 → **页面内右上角自绘**（原生导航栏不能放自定义按钮）
 * 2. `router.push({ name: 'ShopPayment' })` → navigateTo(withQuery(ROUTES.PAYMENT, ...))
 * 3. showAlert/confirm → showToast/showConfirm（platform/feedback）
 * 4. van-empty/van-button → DefaultEmpty + view 按钮（uni-ui 无 empty 组件）
 * 5. onActivated/onDeactivated（KeepAlive）→ onShow/onHide（tabBar 页不销毁）
 * 6. ② 类 CSS 变量 `--cart-bottom-safe: calc(168px + env(...))` → calc 内 px 转 rpx、env 保留
 */
import { onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'

import DefaultEmpty from '@/components/common/BaseState/common/DefaultEmpty.vue'
import { ROUTES, withQuery } from '@/config/routes'
import { showConfirm, showToast } from '@/platform/feedback'
import { navigateTo, setNavigationBarTitle } from '@/platform/navigation'
import { buildSingleShopSelection, describeCrossShopCheckout } from '@/utils/checkout-entry'
import { savePaymentCheckoutDraft } from '@/utils/payment'

import CartBottomBar from './components/CartBottomBar.vue'
import CartStoreCard from './components/CartStoreCard.vue'
import { useCartDetail } from './composables/useCartDetail'

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

// 原生导航栏动态标题（替代 web-user 的 navbarHeader.setHeader）
watch(title, value => setNavigationBarTitle(value), { immediate: true })

function toggleManageMode() {
  if (!hasItems.value) {
    showToast('购物车还是空的')
    return
  }

  manageMode.value = !manageMode.value
}

function checkout() {
  if (selectedCount.value === 0) {
    showToast('请选择需要结算的商品')
    return
  }

  // 微信建单只按单一商家查价。跨商家合并结算会让后端在第一家店算钱、
  // 其余店的商品变成免单或直接建单失败，所以在进支付页前就拦下来。
  const selection = buildSingleShopSelection(checkoutItems.value)
  if (!selection) {
    const crossShop = describeCrossShopCheckout(checkoutItems.value)
    showToast(crossShop
      ? `共 ${crossShop.shopNames.length} 家商家，请分开结算`
      : '购物车商品信息不完整，请重新选择')
    return
  }

  const checkoutProductIds = selectedProducts.value.map(product => product.id)
  markPendingCheckout(checkoutProductIds)

  savePaymentCheckoutDraft({
    shopId: selection.shopId,
    shopName: selection.shopName,
    deliveryFee: 0,
    totalQty: selectedQuantity.value,
    goodsAmount: Number(selectedTotal.value || 0),
    cartItems: checkoutItems.value,
    source: 'cart',
    cartProductIds: checkoutProductIds,
  })

  navigateTo(withQuery(ROUTES.PAYMENT, {
    source: 'cart',
    shopid: selection.shopId,
    amount: selectedTotal.value.toFixed(2),
  }))
}

async function removeSelectedProducts() {
  if (selectedCount.value === 0) {
    showToast('请选择要删除的商品')
    return
  }

  const confirmed = await showConfirm({
    title: '删除商品',
    content: `删除已选的 ${selectedCount.value} 件商品？`,
    confirmText: '删除',
  })

  if (!confirmed)
    return

  removeSelected()
  if (!hasItems.value)
    manageMode.value = false
}

function goMsite() {
  navigateTo(ROUTES.MSITE)
}

// tabBar 页二次进入：标题与状态需重新同步（原生导航栏标题在切 tab 后可能被其他页覆盖）
onShow(() => {
  setNavigationBarTitle(title.value)
})
</script>

<template>
  <view class="cart-page">
    <!-- ★ 「管理/完成」按钮自绘在页面右上角（原生导航栏不能放自定义按钮） -->
    <view
      v-if="hasItems"
      class="manage-toggle"
      @click="toggleManageMode"
    >
      {{ manageMode ? '完成' : '管理' }}
    </view>

    <view
      class="cart-content"
      :class="{ 'cart-content--filled': hasItems }"
    >
      <template v-if="hasItems">
        <CartStoreCard
          v-for="store in stores"
          :key="store.id"
          :store="store"
          :selected="isStoreSelected(store)"
          @toggle-store="toggleStore"
          @toggle-product="toggleProduct"
          @increase="increaseQuantity"
          @decrease="decreaseQuantity"
        />
      </template>

      <view
        v-else
        class="cart-empty"
      >
        <DefaultEmpty />
        <view
          class="go-shopping"
          @click="goMsite"
        >
          去逛逛
        </view>
      </view>
    </view>

    <CartBottomBar
      :total="displayTotal"
      :all-selected="allSelected"
      :selected-count="selectedCount"
      :manage-mode="manageMode"
      @toggle-all="toggleAll"
      @checkout="checkout"
      @remove="removeSelectedProducts"
    />
  </view>
</template>

<style lang="scss" scoped>
.cart-page {
  min-height: 100vh;
  margin: 0 auto;
  color: #444;
  background: $ff;
}

.manage-toggle {
  position: fixed;
  top: 16rpx;
  right: 24rpx;
  z-index: 30;
  padding: 8rpx 24rpx;
  font-size: 26rpx;
  color: $blue;
  background: rgb(49 144 232 / 10%);
  border-radius: 24rpx;
}

.cart-content {
  padding: 20rpx 16rpx;
}

/* ⚠️ 底部安全距「仅在有商品时」生效：--cart-bottom-safe 只在这条分支里定义并使用，
   避免空购物车（居中空状态）多出一截底部 padding 而出现「莫名其妙的滚动」。
   空状态分支不定义该变量 → 不带底部 padding → 内容正常居中、无多余滚动。 */
.cart-content--filled {
  /* ② 类 CSS 变量 + ⑤ 类 calc：px 转 rpx、env() 保留。
     底部 fixed 结算栏(CartBottomBar) + 手机安全区会遮挡列表最后一项，预留出空间 */
  --cart-bottom-safe: calc(336rpx + env(safe-area-inset-bottom));

  padding-bottom: var(--cart-bottom-safe);
}

.cart-empty {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  align-items: center;
  padding-top: 18vh; /* vh 保留不转 */
}

.go-shopping {
  padding: 12rpx 48rpx;
  font-size: 26rpx;
  color: #fff;
  background: $blue;
  border-radius: 32rpx;
}
</style>
