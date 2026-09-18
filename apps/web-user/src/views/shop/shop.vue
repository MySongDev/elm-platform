<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BackTop from '@/components/common/BackTop/BackTop.vue'

import ShopCartBar from './components/ShopCart/ShopCartBar.vue'
import ShopHeader from './components/ShopHeader/ShopHeader.vue'
import CategoryMenu from './components/ShopMenu/CategoryMenu.vue'
import ProductList from './components/ShopMenu/ProductList.vue'
import ShopNav from './components/shopNav/ShopNav.vue'
import ShopReview from './components/ShopReview/ShopReview.vue'
import ShopPageSkeleton from './components/ShopSkeleton/ShopPageSkeleton.vue'
import { useFlyCartAnimation } from './composables/useFlyCartAnimation'
import { useShopCart } from './composables/useShopCart'
import { useShopPageData } from './composables/useShopPageData'
import { useTabSwitch } from './composables/useTabSwitch'

const TABS = ['商品', '评价']

const route = useRoute()
const shopId = computed(() => {
  const id = route.query.shopid
  return Array.isArray(id) ? id[0] : id
})

const outerRef = ref(null)
const shopHeaderRef = ref(null)
const productListRef = ref(null)

const {
  cartMap,
  cartList,
  totalQty,
  totalPrice,
  setShopMeta,
  add: addToCart,
  decrease: decreaseFromCart,
  clear: clearCart,
} = useShopCart(shopId)

const {
  shopData,
  foodMenuData,
  activeCategoryId,
  pageLoading,
} = useShopPageData({
  shopId,
  onPaidOrderConsumed: clearCart,
})

const { activeTab, switchTab } = useTabSwitch({
  tabs: TABS,
  initialTab: TABS[0],
  scrollRef: outerRef,
})

const { flyBalls, handleAdd } = useFlyCartAnimation({ addToCart })

function onCategoryClick(id) {
  activeCategoryId.value = id
  requestAnimationFrame(() => {
    productListRef.value?.scrollToCategory?.(id)
  })
}

function onScrollCategory(id) {
  activeCategoryId.value = Number(id)
}

watch(
  shopData,
  (shop) => {
    if (!shop || !shopId.value)
      return

    setShopMeta({
      shopName: shop.name,
      deliveryFee: shop.float_delivery_fee || 0,
      minAmount: shop.float_minimum_order_amount || 20,
      deliveryTime: shop.order_lead_time ? `${shop.order_lead_time}分钟` : '',
      distance: shop.distance,
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="shop-page">
    <ShopPageSkeleton v-if="pageLoading && !shopData" />

    <div v-else-if="shopData" class="shop-layout">
      <div ref="outerRef" class="outer-scroller">
        <ShopNav :scroll-element="outerRef" />

        <div ref="shopHeaderRef" class="header-zone">
          <ShopHeader :shop="shopData" />
        </div>

        <nav class="sticky-nav">
          <div v-for="tab in TABS" :key="tab" class="tab-item" :class="{ active: activeTab === tab }"
            @click="switchTab(tab)">
            {{ tab }}
          </div>
        </nav>

        <div class="content-gate">
          <template v-if="activeTab === '商品'">
            <CategoryMenu :active-id="activeCategoryId" :categories="foodMenuData" class="side-menu"
              @update:active-id="onCategoryClick" />

            <main class="main-content">
              <ProductList ref="productListRef" :categories="foodMenuData" :active-category-id="activeCategoryId"
                :cart-map="cartMap" :scroll-root="outerRef" @scroll-category="onScrollCategory" @add="handleAdd"
                @decrease="decreaseFromCart" />
            </main>
          </template>

          <template v-else-if="activeTab === '评价'">
            <section class="review-page">
              <ShopReview :shop-id="shopId" />
            </section>
          </template>
        </div>

        <div class="bottom-safe" />
      </div>

      <BackTop :target="outerRef" :show-after="shopHeaderRef" :offset="-50" />

      <ShopCartBar :cart-items="cartList" :delivery-fee="shopData.float_delivery_fee || 0"
        :min-amount="shopData.float_minimum_order_amount || 20" :shop-id="shopId" :shop-name="shopData.name"
        :total-qty="totalQty" :total-price="totalPrice" @add="addToCart" @decrease="decreaseFromCart"
        @clear="clearCart" />

      <div class="fly-ball-layer">
        <div v-for="ball in flyBalls" :key="ball.id" class="fly-ball-outer" :style="{
          left: `${ball.startX}px`,
          top: `${ball.startY}px`,
          transform: ball.flying ? `translateX(${ball.endX - ball.startX}px)` : 'translateX(0)',
        }">
          <div class="fly-ball-inner" :style="{
            transform: ball.flying ? `translateY(${ball.endY - ball.startY}px) scale(0.4)` : 'translateY(0) scale(1)',
          }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./shop.scss" lang="scss" scoped></style>
