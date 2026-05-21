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
