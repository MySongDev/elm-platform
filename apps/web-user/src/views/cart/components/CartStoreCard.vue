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
  border-radius: 18px;
  padding: 10px;
  box-shadow: 0 1px 0 rgba(17, 24, 39, 0.02);
}

.store-card+.store-card {
  margin-top: 5px;
}

.store-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 28px;
}

.store-line {
  min-width: 0;
  display: flex;
  align-items: center;
}

.store-name {
  min-width: 0;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.store-arrow {
  flex: 0 0 auto;
  margin-left: 3px;
  font-size: 16px;
}

.delivery-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #777;
  font-size: 13px;
  white-space: nowrap;
}

.reserve-info {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 156px;
  height: 24px;
  color: #2397db;
  font-size: 12px;
  white-space: nowrap;
}

.reserve-tag,
.reserve-time {
  height: 22px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #4db0ea;
}

.reserve-tag {
  padding: 0 7px;
  border-radius: 5px 0 0 5px;
  background: #36a7ea;
  color: #fff;
}

.reserve-time {
  padding: 0 7px;
  border-left: 0;
  border-radius: 0 5px 5px 0;
  background: #fff;
}

.product-list {
  margin-top: 15px;
}

@media (max-width: 374px) {
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
