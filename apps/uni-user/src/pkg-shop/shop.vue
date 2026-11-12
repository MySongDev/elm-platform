<script setup>
/** 商家页负责生命周期、数据与购物车接入、结算；点菜区的滚动细节归 ShopMenu。 */
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'

import { useCheckoutEntry } from '@/composables/features/useCheckoutEntry'
import { ROUTES, withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { createAuthGuard, navigateTo } from '@/platform/navigation'
import { useUserStore } from '@/stores/modules/store-user'
import { buildPaymentCartItems, savePaymentCheckoutDraft } from '@/utils/payment'

import CartBar from './components/CartBar.vue'
import ShopHeader from './components/ShopHeader.vue'
import ShopMenu from './components/ShopMenu.vue'
import ShopReview from './components/ShopReview.vue'
import { useShopCart } from './composables/useShopCart'
import { useShopPageData } from './composables/useShopPageData'

const TABS = ['点菜', '评价']

const userStore = useUserStore()
const checkoutEntry = useCheckoutEntry()

const shopId = ref('')
const activeTab = ref(TABS[0])

onLoad((options) => {
  shopId.value = String(options?.shopid ?? '')
})

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
  loadError,
  loadCategoryFoods,
  loadShopData,
  consumePaidOrder,
} = useShopPageData(shopId, { onPaidOrderConsumed: clearCart })

const authGuard = createAuthGuard('/pkg-shop/shop')

// 从支付页返回时 onLoad 不重跑；鉴权与支付成功后的清车检查都要放在 onShow。
onShow(() => {
  authGuard()
  consumePaidOrder()
})

watch(
  shopData,
  (shop) => {
    if (!shop || !shopId.value) {
      return
    }

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

/**
 * 写支付草稿 → 跳 payment。草稿形状与 web-user ShopCartBar.checkout 一致，
 * payment.vue 只读草稿（shopId/shopName/deliveryFee/totalQty/goodsAmount/cartItems）。
 *
 * 本页只结算本店全部商品，天然满足后端单一商家查价。
 * 本页与 cart 页都用订单快照精确扣减；只有旧非微信流程无快照时才保留原清车兜底。
 * 结算前先登记快照，把 requestId 落到持久化里：
 * 建单响应丢失后用户重试会带同一个 ID，后端才能回原单而不是多建一张。
 */
function onCheckout() {
  const shop = shopData.value
  const cartItems = buildPaymentCartItems(cartList.value)

  // buildPaymentCartItems 会滤掉价格为 0 / 缺 item_id 的项；全被滤掉时 payment
  // 页的 canSubmit 必为 false，与其跳过去再报「订单信息不完整」，不如在这里拦
  if (!shop || cartItems.length === 0) {
    showToast('购物车商品信息不完整，请重新选购')
    return
  }

  const serverItems = cartItems.map(item => ({
    itemId: String(item.itemId),
    skuId: String(item.skuId),
    qty: item.qty,
  }))
  checkoutEntry.beginCheckout({
    userId: userStore.userId,
    shopId: shopId.value,
    cartItems: serverItems,
  })

  savePaymentCheckoutDraft({
    shopId: shopId.value,
    shopName: shop.name,
    deliveryFee: Number(shop.float_delivery_fee || 0),
    totalQty: totalQty.value,
    goodsAmount: Number(totalPrice.value || 0),
    cartItems,
  })

  navigateTo(withQuery(ROUTES.PAYMENT, {
    shopid: shopId.value,
    shopName: shop.name,
    amount: Number(totalPrice.value || 0).toFixed(2),
  }))
}

const pageState = computed(() => {
  if (pageLoading.value) {
    return 'loading'
  }
  if (loadError.value) {
    return 'error'
  }
  if (shopData.value) {
    return 'success'
  }
  return ''
})
</script>

<template>
  <view class="shop-page">
    <!-- 主内容不放进 BaseState 插槽：它的根节点高度 auto，会断开 scroll-view 的高度链。 -->
    <view v-if="pageState === '' || pageState === 'success'" class="shop-body">
      <ShopHeader :shop="shopData" />

      <view class="tab-bar">
        <view
          v-for="tab in TABS"
          :key="tab"
          class="tab-item"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          <text class="tab-item__text">
            {{ tab }}
          </text>
          <view v-if="activeTab === tab" class="tab-item__underline" />
        </view>
      </view>

      <view class="content-area">
        <!-- 切评价只隐藏外框，不销毁 ShopMenu，保留点菜滚动位置。 -->
        <view v-show="activeTab === '点菜'" class="menu-panel">
          <ShopMenu
            v-model:active-category-id="activeCategoryId"
            class="menu-panel__content"
            :shop-id="shopId"
            :food-menu-data="foodMenuData"
            :cart-map="cartMap"
            :active="activeTab === '点菜'"
            :load-category-foods="loadCategoryFoods"
            @add="addToCart"
            @decrease="decreaseFromCart"
          />
        </view>

        <ShopReview v-show="activeTab === '评价'" :shop-id="shopId" />
      </view>

      <CartBar
        :total-qty="totalQty"
        :total-price="totalPrice"
        :min-amount="shopData?.float_minimum_order_amount || 20"
        :delivery-fee="shopData?.float_delivery_fee || 0"
        @checkout="onCheckout"
      />
    </view>

    <BaseState v-else class="shop-state" :state="pageState" @retry="loadShopData" />
  </view>
</template>

<style lang="scss" scoped>
.shop-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}

.shop-body {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* BaseState 根节点高度 auto，显式铺满父容器，避免错误态只占内容高度。 */
.shop-state {
  position: absolute;
  inset: 0;
  z-index: 30;
}

.tab-bar {
  display: flex;
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.tab-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
  align-items: center;
  padding: 24rpx 0 16rpx;
}

.tab-item__text {
  font-size: 30rpx;
  color: #666;
}

.tab-item.active .tab-item__text {
  font-size: 32rpx;
  font-weight: 800;
  color: #222;
}

.tab-item__underline {
  width: 40rpx;
  height: 8rpx;
  background: #ffd600;
  border-radius: 4rpx;
}

.content-area {
  flex: 1;
  min-height: 0;
}

.menu-panel {
  height: 100%;
}

/* 小程序 v-show 生成 hidden；显式提高隐藏规则权重，避免组件外框继续占位。 */
.menu-panel[hidden] {
  display: none !important;
}

/* 小程序多一层组件宿主，必须明确接续高度；只给 ShopMenu 内部根节点 100% 不够。 */
.menu-panel__content {
  display: block;
  height: 100%;
}
</style>
