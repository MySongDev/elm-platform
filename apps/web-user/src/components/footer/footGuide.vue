<script setup>
import { storeToRefs } from 'pinia'

import { useCartStore } from '@/stores/modules/store-cart'

const cartStore = useCartStore()
const { totalQuantity } = storeToRefs(cartStore)
</script>

<template>
  <van-tabbar route fixed placeholder>
    <van-tabbar-item to="/msite">
      <template #icon="props">
        <SvgIcon :icon-name="props.active ? 'eleme' : 'download'" icon-class="tabbar-icon" />
      </template>
      <span>外卖</span>
    </van-tabbar-item>
    <van-tabbar-item icon="search" to="/search">
      搜索
    </van-tabbar-item>

    <van-tabbar-item icon="cart-o" to="/cart" :badge="totalQuantity || undefined">
      购物车
    </van-tabbar-item>

    <van-tabbar-item icon="user-o" to="/profile">
      用户
    </van-tabbar-item>
  </van-tabbar>
</template>

<style scoped>
:deep(.van-tabbar-item--active .van-tabbar-item__icon) {
  color: var(--van-tabbar-item-active-color);
}

:deep(.van-tabbar-item--active .van-tabbar-item__text) {
  span {
    color: var(--van-tabbar-item-active-color);
  }
}
</style>
