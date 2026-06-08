<script setup>
import { computed } from 'vue'

import CartCheckButton from './CartCheckButton.vue'
import CartProductRow from './CartProductRow.vue'

const props = defineProps({
  store: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-store', 'toggle-product', 'increase', 'decrease'])

const hasDeliveryInfo = computed(() => props.store.deliveryTime || props.store.distance)
const hasReserveInfo = computed(() => props.store.reserveText || props.store.deliveryText)
</script>

<template>
  <section class="store-card">
    <header class="store-header">
      <CartCheckButton :checked="selected" :aria-label="selected ? '取消选择店铺' : '选择店铺'"
        @click="emit('toggle-store', store.id)" />

      <div class="store-main">
        <div class="store-line">
          <h2 class="store-name">
            {{ store.name }}
          </h2>
          <van-icon class="store-arrow" name="arrow" />
        </div>

        <div v-if="hasReserveInfo" class="reserve-info">
          <span v-if="store.reserveText" class="reserve-tag">{{ store.reserveText }}</span>
          <span v-if="store.deliveryText" class="reserve-time">{{ store.deliveryText }}</span>
        </div>

        <div v-if="hasDeliveryInfo" class="delivery-info">
          <span>{{ store.deliveryTime }}</span>
          <span>{{ store.distance }}</span>
        </div>
      </div>
    </header>

    <div class="product-list">
      <CartProductRow v-for="product in store.products" :key="product.id" :product="product"
        @toggle="emit('toggle-product', $event)" @increase="emit('increase', $event)"
        @decrease="emit('decrease', $event)" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.store-card {
  padding: 10px;
  border-radius: 18px;
  box-shadow: 0 1px 0 rgb(17 24 39 / 2%);
}

.store-card+.store-card {
  margin-top: 5px;
}

.store-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.store-main {
  display: flex;
  flex: 1;
  gap: 28px;
  align-items: center;
  min-width: 0;
}

.store-line {
  display: flex;
  align-items: center;
  min-width: 0;
}

.store-name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-arrow {
  flex: 0 0 auto;
  margin-left: 3px;
  font-size: 16px;
}

.delivery-info {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #777;
  white-space: nowrap;
}

.reserve-info {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 156px;
  height: 24px;
  font-size: 12px;
  color: #2397db;
  white-space: nowrap;
}

.reserve-tag,
.reserve-time {
  display: inline-flex;
  align-items: center;
  height: 22px;
  border: 1px solid #4db0ea;
}

.reserve-tag {
  padding: 0 7px;
  color: #fff;
  background: #36a7ea;
  border-radius: 5px 0 0 5px;
}

.reserve-time {
  padding: 0 7px;
  background: #fff;
  border-left: 0;
  border-radius: 0 5px 5px 0;
}

.product-list {
  margin-top: 15px;
}

@media (width <= 374px) {
  .store-card {
    padding-inline: 14px;
  }

  .store-main {
    flex-wrap: wrap;
  }

  .reserve-info,
  .delivery-info {
    justify-content: flex-start;
  }
}
</style>
