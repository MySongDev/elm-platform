// ⚠️ 与 apps/web-user/src/stores/modules/store-cart.js 同源，修改需同步两处业务逻辑。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★★ 本文件是议题 1 决策的唯一改造点：web-user 用 pinia-plugin-persistedstate
// （`:301-305` 的 persist + pick），uni-user **去掉插件改手动持久化**。理由（议题 1 实测）：
// - 全项目只有这 1 个 store 用插件、1 处配置，为一个 pick 数组引第三方插件不值
// - 去掉后 5 个 store 全是「显式手动持久化」或「无持久化」，心智统一
//
// 手动持久化设计（议题 1 已定）：
// 1. **key 升 v3**：插件序列化的 v2 格式与手写格式结构可能不同（插件可能带包装层），
//    换 key 彻底避免读到旧格式解析异常。uni-user 是全新工程，无历史数据包袱。
// 2. **watch 自动持久化**而非逐点插调用：store 有 12 个变更入口
//    （addShopFood/decreaseShopFood/clearShop/setShopMeta/toggleAll/toggleStore/
//    toggleProduct/increaseQuantity/decreaseQuantity/removeSelected/
//    markPendingCheckout/consumePaidCheckout），逐点插容易漏 → 静默丢数据。
//    deep watch 一次覆盖全部，新增方法自动纳入。
// 3. **pendingMeta 不持久化**：它是 Map 而非 ref（JSON.stringify(Map) 得 {}），
//    这正是 web-user 必须显式 pick 的原因。手动方案天然规避。
// 4. ⚠️ legacy 兼容代码不搬：web-user `:13` 的 LEGACY_PENDING_CHECKOUT_KEY 是
//    从 v1 迁移的兼容逻辑，uni-user 无历史用户 → 删掉。
// 5. ⚠️ deep watch 每次勾选都写 storage（uni.setStorageSync 是同步 IO）。
//    购物车数据量很小（几店 × 每店几商品），开销可忽略；若真机实测卡顿再加防抖。

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { getStore, setStore } from '@/platform/storage'
import { createProductId, normalizeStore, productFromFood, toNumber, toText } from '@/utils/cart'

const CART_STORAGE_KEY = 'elm_cart_store_v3'
const CART_CHECKOUT_SHOP_ID = 'cart-checkout'

/** 恢复（模块初始化时一次）。⚠️ 校验形状：读到的可能是别的端的脏数据 */
function restoreCart() {
  const cached = getStore(CART_STORAGE_KEY)

  if (!cached || typeof cached !== 'object') {
    return {
      stores: [],
      pendingCheckout: null,
    }
  }

  return {
    stores: Array.isArray(cached.stores) ? cached.stores : [],
    pendingCheckout: cached.pendingCheckout ?? null,
  }
}

const restored = restoreCart()

export const useCartStore = defineStore('cart', () => {
  const stores = ref(restored.stores)
  const pendingCheckout = ref(restored.pendingCheckout)
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

  // ★ 手动持久化：deep watch 覆盖全部 12 个变更入口，零遗漏风险
  watch(
    [stores, pendingCheckout],
    () => {
      setStore(CART_STORAGE_KEY, {
        stores: stores.value,
        pendingCheckout: pendingCheckout.value,
      })
    },
    { deep: true },
  )

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
