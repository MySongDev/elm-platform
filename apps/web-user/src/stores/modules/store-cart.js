import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { getImageUrl } from '@/config'
import { getStore, removeStore, setStore } from '@/utils/storage/storage'

const CART_STORAGE_KEY = 'elm_cart_store_v1'
const CART_PENDING_CHECKOUT_KEY = 'elm_cart_pending_checkout_v1'
const LEGACY_SHOP_CART_PREFIX = 'shop_cart_'
const CART_CHECKOUT_SHOP_ID = 'cart-checkout'

function toText(value, fallback = '') {
  if (value === null || value === undefined)
    return fallback

  return String(value)
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function getCurrentSpec(food, specIndex = 0) {
  return food?.specfoods?.[specIndex] || food?.specfoods?.[0] || {}
}

function getSpecLabel(spec = {}) {
  if (spec.specs_name)
    return spec.specs_name

  const labels = (spec.specs || [])
    .map(item => item?.value)
    .filter(Boolean)

  return labels.join(' / ')
}

function createProductId(shopId, food, specIndex = 0) {
  const spec = getCurrentSpec(food, specIndex)
  const skuId = spec.sku_id || spec.food_id || spec.item_id || specIndex
  return `${shopId}-${food?.item_id || food?._id || food?.name}-${skuId}`
}

function normalizeProduct(product = {}) {
  const quantity = Math.max(1, toNumber(product.quantity ?? product.qty, 1))
  const price = toNumber(product.price ?? product.unitPrice, 0)

  return {
    id: toText(product.id || product.productId || product.itemId || product.skuId),
    itemId: toText(product.itemId || product.food?.item_id || product.id),
    skuId: toText(product.skuId || product.id),
    name: toText(product.name || product.title || product.food?.name, '商品'),
    spec: toText(product.spec),
    image: toText(product.image || getImageUrl(product.food?.image_path)),
    price,
    originPrice: toNumber(product.originPrice || product.originalPrice, 0),
    quantity,
    selected: Boolean(product.selected),
    tag: toText(product.tag),
    specIndex: toNumber(product.specIndex, 0),
    food: product.food || null,
  }
}

function normalizeStore(store = {}) {
  const id = toText(store.id || store.shopId)
  const products = Array.isArray(store.products)
    ? store.products.map(normalizeProduct).filter(product => product.id && product.price > 0)
    : []

  return {
    id,
    name: toText(store.name || store.shopName, '当前商家'),
    deliveryFee: toNumber(store.deliveryFee, 0),
    minAmount: toNumber(store.minAmount, 20),
    deliveryTime: toText(store.deliveryTime),
    distance: toText(store.distance),
    reserveText: toText(store.reserveText),
    deliveryText: toText(store.deliveryText),
    products,
  }
}

function productFromFood(shopId, food, specIndex = 0, selected = false) {
  const spec = getCurrentSpec(food, specIndex)
  const specLabel = getSpecLabel(spec)

  return normalizeProduct({
    id: createProductId(shopId, food, specIndex),
    itemId: food?.item_id || food?._id,
    skuId: spec.sku_id || spec.food_id || food?.item_id,
    name: food?.name,
    spec: specLabel ? `规格:${specLabel}` : '',
    image: getImageUrl(food?.image_path),
    price: spec.price,
    originPrice: spec.original_price,
    quantity: 1,
    selected,
    tag: food?.attributes?.[0]?.icon_name || '',
    specIndex,
    food,
  })
}

function loadLegacyStores() {
  if (typeof window === 'undefined')
    return []

  const stores = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith(LEGACY_SHOP_CART_PREFIX))
      continue

    try {
      const shopId = key.replace(LEGACY_SHOP_CART_PREFIX, '')
      const value = JSON.parse(window.localStorage.getItem(key) || '{}')
      const products = (value.items || [])
        .map(([, item]) => {
          const product = productFromFood(shopId, item.food, item.specIndex || 0, false)
          product.quantity = Math.max(1, toNumber(item.qty, 1))
          return product
        })
        .filter(product => product.id && product.price > 0)

      if (products.length) {
        stores.push(normalizeStore({
          id: shopId,
          name: `商家 ${shopId}`,
          products,
        }))
      }
    }
    catch {
    }
  }

  return stores
}

function loadStores() {
  const savedStores = getStore(CART_STORAGE_KEY)
  if (Array.isArray(savedStores))
    return savedStores.map(normalizeStore).filter(store => store.id && store.products.length)

  return loadLegacyStores()
}

function cloneStores(stores) {
  return stores.map(store => ({
    ...store,
    products: store.products.map(product => ({ ...product })),
  }))
}

export const useCartStore = defineStore('cart', () => {
  const stores = ref(loadStores())
  const pendingCheckout = ref(getStore(CART_PENDING_CHECKOUT_KEY) || null)

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

  function persist() {
    setStore(CART_STORAGE_KEY, cloneStores(stores.value))
  }

  function persistPendingCheckout() {
    if (pendingCheckout.value)
      setStore(CART_PENDING_CHECKOUT_KEY, pendingCheckout.value)
    else
      removeStore(CART_PENDING_CHECKOUT_KEY)
  }

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

    ensureStore(shopId, meta)
  }

  function addShopFood(shopId, food, specIndex = 0, meta = {}) {
    if (!shopId || !food)
      return

    const store = ensureStore(shopId, meta)
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

  watch(stores, persist, { deep: true })
  watch(pendingCheckout, persistPendingCheckout, { deep: true })

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
})
