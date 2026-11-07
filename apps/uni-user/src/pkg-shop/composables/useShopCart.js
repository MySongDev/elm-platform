// shop 页购物车视图模型：把全局 cart store 按当前 shopId 收窄成页面要的几个量。
//
// ⚠️ 与 web-user useShopCart.js 同源，差异只有两处：
// 1. store 的 import 路径（uni-user 的 store-cart 是手动持久化版，议题 1）
// 2. 去掉 setShopMeta 之外的 pendingCheckout 相关暴露（shop 页用不到）
import { computed } from 'vue'

import { useCartStore } from '@/stores/modules/store-cart'

function resolveShopId(shopId) {
  const id = shopId?.value ?? shopId
  return id == null ? '' : String(id)
}

export function useShopCart(shopId) {
  const cartStore = useCartStore()
  const currentShopId = computed(() => resolveShopId(shopId))

  const cartMap = computed(() => cartStore.getShopCartMap(currentShopId.value))
  const cartList = computed(() => cartStore.getShopCartList(currentShopId.value))
  const totalQty = computed(() => cartStore.getShopTotalQty(currentShopId.value))
  const totalPrice = computed(() => cartStore.getShopTotalPrice(currentShopId.value))

  function setShopMeta(meta = {}) {
    cartStore.setShopMeta(currentShopId.value, meta)
  }

  function add(food, specIndex = 0) {
    cartStore.addShopFood(currentShopId.value, food, specIndex)
  }

  function decrease(food, specIndex = 0) {
    cartStore.decreaseShopFood(currentShopId.value, food, specIndex)
  }

  function clear() {
    cartStore.clearShop(currentShopId.value)
  }

  return {
    cartMap,
    cartList,
    totalQty,
    totalPrice,
    setShopMeta,
    add,
    decrease,
    clear,
  }
}
