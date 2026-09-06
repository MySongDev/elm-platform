import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createProductId, normalizeStore, productFromFood, toNumber, toText } from '@/utils/cart'

import { getStore } from '@/utils/storage/storage'

// v1 遗留数据源：仅用于首次迁移到 v2（见下方 persist 配置），不再写入
// const LEGACY_CART_STORAGE_KEY = 'elm_cart_store_v1'
const LEGACY_PENDING_CHECKOUT_KEY = 'elm_cart_pending_checkout_v1'
const CART_CHECKOUT_SHOP_ID = 'cart-checkout'

// v2 无数据时以 v1 为初始值，首次持久化自动迁移
// function loadStores() {
//   const savedStores = getStore(LEGACY_CART_STORAGE_KEY)
//   if (Array.isArray(savedStores))
//     return savedStores.map(normalizeStore).filter(store => store.id && store.products.length)

//   return []
// }

export const useCartStore = defineStore('cart', () => {
  const stores = ref([])
  const pendingCheckout = ref(getStore(LEGACY_PENDING_CHECKOUT_KEY) || null)
  const pendingMeta = new Map()

  const products = computed(() => stores.value.flatMap(store => store.products))
  const totalCount = computed(() => products.value.length)
  const totalQuantity = computed(() =>
    products.value.reduce((sum, product) => sum + product.quantity, 0),
  )
  const selectedProducts = computed(() => products.value.filter(product => product.selected))
  const selectedCount = computed(() => selectedProducts.value.length)
  const selectedQuantity = computed(() =>
    selectedProducts.value.reduce((sum, product) => sum + product.quantity, 0),
  )
  const selectedTotal = computed(() =>
    selectedProducts.value.reduce((sum, product) => sum + product.price * product.quantity, 0),
  )
  const allSelected = computed(() =>
    products.value.length > 0 && products.value.every(product => product.selected),
  )
  const hasItems = computed(() => products.value.length > 0)
  const checkoutItems = computed(() => {
    return stores.value.flatMap((store) => {
      return store.products
        .filter(product => product.selected)
        .map(product => ({
          itemId: product.itemId,
          skuId: product.skuId,
          title: product.name,
          qty: product.quantity,
          unitPrice: Number(product.price || 0),
          shopId: store.id,
          shopName: store.name,
        }))
    })
  })

  function findStore(shopId) {
    return stores.value.find(store => String(store.id) === String(shopId))
  }

  function ensureStore(shopId, meta = {}) {
    const id = toText(shopId)
    let store = findStore(id)

    if (!store) {
      store = normalizeStore({
        id,
        name: meta.shopName || meta.name || '当前商家',
        deliveryFee: meta.deliveryFee,
        minAmount: meta.minAmount,
        deliveryTime: meta.deliveryTime,
        distance: meta.distance,
        reserveText: meta.reserveText,
        deliveryText: meta.deliveryText,
        products: [],
      })
      stores.value.push(store)
      return store
    }

    if (meta.shopName || meta.name)
      store.name = toText(meta.shopName || meta.name)
    if (meta.deliveryFee !== undefined)
      store.deliveryFee = toNumber(meta.deliveryFee, store.deliveryFee)
    if (meta.minAmount !== undefined)
      store.minAmount = toNumber(meta.minAmount, store.minAmount)
    if (meta.deliveryTime !== undefined)
      store.deliveryTime = toText(meta.deliveryTime)
    if (meta.distance !== undefined)
      store.distance = toText(meta.distance)
    if (meta.reserveText !== undefined)
      store.reserveText = toText(meta.reserveText)
    if (meta.deliveryText !== undefined)
      store.deliveryText = toText(meta.deliveryText)

    return store
  }

  function removeEmptyStores() {
    stores.value = stores.value.filter(store => store.products.length > 0)
  }

  function setShopMeta(shopId, meta = {}) {
    if (!shopId)
      return

    pendingMeta.set(shopId, {
      ...pendingMeta.get(shopId),
      ...meta,
    })
  }

  function addShopFood(shopId, food, specIndex = 0, meta = {}) {
    if (!shopId || !food)
      return

    const mergedMeta = {
      ...pendingMeta.get(shopId),
      ...meta,
    }
    const store = ensureStore(shopId, mergedMeta)
    pendingMeta.delete(shopId)
    const normalizedSpecIndex = toNumber(specIndex, 0)
    const productId = createProductId(shopId, food, normalizedSpecIndex)
    const existing = store.products.find(product => product.id === productId)

    if (existing) {
      existing.quantity += 1
      return
    }

    store.products.push(productFromFood(shopId, food, normalizedSpecIndex, false))
  }

  function decreaseShopFood(shopId, food, specIndex = 0) {
    if (!shopId || !food)
      return

    const store = findStore(shopId)
    if (!store)
      return

    const productId = createProductId(shopId, food, toNumber(specIndex, 0))
    const product = store.products.find(item => item.id === productId)
    if (!product)
      return

    product.quantity -= 1
    if (product.quantity <= 0)
      store.products = store.products.filter(item => item.id !== productId)

    removeEmptyStores()
  }

  function clearShop(shopId) {
    stores.value = stores.value.filter(store => String(store.id) !== String(shopId))
  }

  function getShopCartMap(shopId) {
    const store = findStore(shopId)
    const map = new Map()
    if (!store)
      return map

    store.products.forEach((product) => {
      if (!product.food)
        return

      const item = {
        food: product.food,
        qty: product.quantity,
        specIndex: product.specIndex,
      }
      map.set(`${product.itemId}-${product.specIndex}`, item)
      if (product.specIndex === 0)
        map.set(product.itemId, item)
    })

    return map
  }

  function getShopCartList(shopId) {
    const store = findStore(shopId)
    if (!store)
      return []

    return store.products
      .filter(product => product.food)
      .map(product => ({
        food: product.food,
        qty: product.quantity,
        specIndex: product.specIndex,
      }))
  }

  function getShopTotalQty(shopId) {
    const store = findStore(shopId)
    return store?.products.reduce((sum, product) => sum + product.quantity, 0) || 0
  }

  function getShopTotalPrice(shopId) {
    const store = findStore(shopId)
    return store?.products.reduce((sum, product) => sum + product.price * product.quantity, 0) || 0
  }

  function isStoreSelected(store) {
    return store.products.length > 0 && store.products.every(product => product.selected)
  }

  function toggleAll() {
    const nextSelected = !allSelected.value
    products.value.forEach((product) => {
      product.selected = nextSelected
    })
  }

  function toggleStore(shopId) {
    const store = findStore(shopId)
    if (!store)
      return

    const nextSelected = !isStoreSelected(store)
    store.products.forEach((product) => {
      product.selected = nextSelected
    })
  }

  function toggleProduct(productId) {
    const product = products.value.find(item => item.id === productId)
    if (product)
      product.selected = !product.selected
  }

  function increaseQuantity(productId) {
    const product = products.value.find(item => item.id === productId)
    if (product)
      product.quantity += 1
  }

  function decreaseQuantity(productId) {
    const product = products.value.find(item => item.id === productId)
    if (!product)
      return

    product.quantity = Math.max(1, product.quantity - 1)
  }

  function removeSelected() {
    stores.value.forEach((store) => {
      store.products = store.products.filter(product => !product.selected)
    })
    removeEmptyStores()
  }

  function markPendingCheckout(productIds) {
    pendingCheckout.value = {
      shopId: CART_CHECKOUT_SHOP_ID,
      productIds: [...productIds],
      createdAt: Date.now(),
    }
  }

  function consumePaidCheckout(shopId) {
    if (!pendingCheckout.value)
      return

    if (shopId && String(shopId) !== pendingCheckout.value.shopId)
      return

    const ids = new Set(pendingCheckout.value.productIds)
    stores.value.forEach((store) => {
      store.products = store.products.filter(product => !ids.has(product.id))
    })
    removeEmptyStores()
    pendingCheckout.value = null
  }

  return {
    stores,
    products,
    totalCount,
    totalQuantity,
    selectedProducts,
    selectedCount,
    selectedQuantity,
    selectedTotal,
    allSelected,
    hasItems,
    checkoutItems,
    setShopMeta,
    addShopFood,
    decreaseShopFood,
    clearShop,
    getShopCartMap,
    getShopCartList,
    getShopTotalQty,
    getShopTotalPrice,
    isStoreSelected,
    toggleAll,
    toggleStore,
    toggleProduct,
    increaseQuantity,
    decreaseQuantity,
    removeSelected,
    markPendingCheckout,
    consumePaidCheckout,
  }
}, {
  persist: {
    // v1 为数组格式，与插件序列化的对象格式不兼容，必须换 key
    key: 'elm_cart_store_v2',
    pick: ['stores', 'pendingCheckout'],
  },
})
