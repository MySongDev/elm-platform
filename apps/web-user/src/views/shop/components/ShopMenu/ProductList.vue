<script setup>
import { useMenuScroll } from '@/composables/ui'
import MenuCategoryBlock from './MenuCategoryBlock.vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  activeCategoryId: [Number, String],
  cartMap: {
    type: Map,
    default: () => new Map(),
  },
  scrollRoot: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['add', 'decrease', 'scroll-category'])

const { scrollToCategory } = useMenuScroll({
  categories: () => props.categories,
  scrollRoot: () => props.scrollRoot,
  onActiveChange: id => emit('scroll-category', id),
})

defineExpose({ scrollToCategory })
</script>

<template>
  <section class="product-list">
    <p class="global-tip">
      -----温馨提示：请适量点餐-----
    </p>

    <MenuCategoryBlock v-for="(cat, index) in categories" :key="cat.id"
      :category="cat" :cart-map="cartMap" :is-last="index === categories.length - 1" @add="(food, specs, rect) => emit('add', food, specs, rect)"
      @decrease="emit('decrease', $event)" />

    <div class="bottom-safe" />
  </section>
</template>

<style lang="scss" scoped>
.product-list {
  flex: 1;
  min-width: 0;
  background: #fff;
}

.global-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  background: #fff;
  border-radius: 6px;
}

.bottom-safe {
  height: 72px;
}
</style>
