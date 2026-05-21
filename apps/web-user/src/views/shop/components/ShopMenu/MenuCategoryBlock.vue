<!-- ShopMenu/MenuCategoryBlock.vue -->
<script setup>
import MenuFoodItem from './MenuFoodItem.vue'

defineProps({
  category: { type: Object, required: true },
  cartMap: { type: Map, default: () => new Map() },
  isLast: { type: Boolean, default: false },
})
const emit = defineEmits(['add', 'decrease'])
</script>

<template>
  <div class="category-section" :data-category-id="String(category.id)"
    :class="{ 'is-promo': category.type === 1, 'is-last': isLast }">
    <header class="section-head">
      <div class="section-title-row">
        <span class="section-name">{{ category.name }}</span>
        <span v-if="category.description" class="section-desc">{{ category.description }}</span>
      </div>
    </header>

    <MenuFoodItem v-for="p in category.foods || []" :key="p._id || p.item_id" :food="p" :cart-map="cartMap"
      @add="(food, specs, rect) => emit('add', food, specs, rect)" @decrease="emit('decrease', $event)" />
    <div v-if="isLast">
      已经到底了
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-section {
  margin-bottom: 18px;
  // scroll-margin-top: 91px;

  &.is-promo {
    border-radius: 10px;
  }

  // 【关键修复】最后一个分类撑开剩余视口，确保 scrollTo 能将其置顶
  &.is-last {
    min-height: calc(100vh - 150px);
  }
}

.section-head {
  position: sticky;
  top: calc(var(--nav-height) + var(--tab-height)); // 50px + 42px
  margin-bottom: 8px;
  padding: 10px 0 4px 10px;
  background: linear-gradient(180deg, #fff4ea 0%, #fff 48px);
}

.section-title-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-name {
  font-size: 16px;
  font-weight: 800;
  color: #222;
  @include text-ellipsis();
}

.section-desc {
  font-size: 12px;
  color: #999;
}
</style>
