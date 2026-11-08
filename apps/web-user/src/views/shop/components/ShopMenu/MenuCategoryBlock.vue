<!-- ShopMenu/MenuCategoryBlock.vue -->
<script setup>
import MenuFoodItem from './MenuFoodItem.vue'

defineProps({
  category: {
    type: Object,
    required: true,
  },
  cartMap: {
    type: Map,
    default: () => new Map(),
  },
  isLast: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['add', 'decrease', 'load'])
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
    <!-- 页尾是可视区加载哨兵，不放在分类标题：第二页只能在已加载菜品的末尾触发。 -->
    <div class="category-loader" :class="{ 'is-placeholder': !category.loaded }"
      :data-load-category-id="String(category.id)">
      <span v-if="category.loading">菜品加载中…</span>
      <button v-else-if="category.loadError" type="button" @click="emit('load', category.id, true)">
        加载失败，点击重试
      </button>
      <button v-else-if="!category.loaded || category.hasMore" type="button" @click="emit('load', category.id)">
        {{ category.loaded ? '加载更多菜品' : '加载本分类菜品' }}
      </button>
      <span v-else>{{ category.foods.length ? '本分类已全部加载' : '本分类暂无菜品' }}</span>
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

.category-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  font-size: 13px;
  color: #888;

  &.is-placeholder {
    min-height: 140px;
  }

  button {
    padding: 10px 12px;
    color: #666;
    cursor: pointer;
    background: #f7f7f7;
    border: 0;
    border-radius: 8px;
  }
}

.section-head {
  position: sticky;
  top: calc(var(--nav-height) + var(--tab-height)); // 50px + 42px
  padding: 10px 0 4px 10px;
  margin-bottom: 8px;
  background: linear-gradient(180deg, #fff4ea 0%, #fff 48px);
}

.section-title-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-name {
  @include text-ellipsis;

  font-size: 16px;
  font-weight: 800;
  color: #222;
}

.section-desc {
  font-size: 12px;
  color: #999;
}
</style>
