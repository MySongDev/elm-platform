<script setup>
import { ref, watch } from 'vue'
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
const emit = defineEmits(['add', 'decrease', 'scroll-category', 'load-category'])
const listRef = ref(null)

// 只观察各分类已加载菜品的页尾。换页后页尾向下移动，重新观察可补齐不足一屏的小分类。
// 隐藏/卸载商品 tab 时断开观察；失败分类由按钮重试，不因仍在可视区而无限请求。
watch([listRef, () => props.scrollRoot, () => props.categories, () => props.activeCategoryId], (_values, _old, onCleanup) => {
  if (!listRef.value || !props.scrollRoot || typeof IntersectionObserver === 'undefined') {
    return
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue
      }
      const id = entry.target.dataset.loadCategoryId
      const index = props.categories.findIndex(item => String(item.id) === id)
      const activeIndex = props.categories.findIndex(item => String(item.id) === String(props.activeCategoryId))
      const category = props.categories[index]
      // 点击跳分类后不补载目标上方的占位块，否则它们增高会把目标分类挤出定位位置。
      // 用户向上滚动时 activeIndex 随锚点回退，之前跳过的分类仍可正常加载。
      if (index >= activeIndex && category?.hasMore && !category.loading && !category.loadError) {
        emit('load-category', category.id)
      }
    }
  }, {
    root: props.scrollRoot,
    rootMargin: '0px 0px 160px 0px',
  })
  listRef.value.querySelectorAll('[data-load-category-id]').forEach(element => observer.observe(element))
  onCleanup(() => observer.disconnect())
}, { flush: 'post' })

const { scrollToCategory } = useMenuScroll({
  scrollRoot: () => props.scrollRoot,
  onActiveChange: id => emit('scroll-category', id),
})

defineExpose({ scrollToCategory })
</script>

<template>
  <section ref="listRef" class="product-list">
    <p class="global-tip">
      -----温馨提示：请适量点餐-----
    </p>

    <p v-if="!categories.length" class="global-tip">
本店暂无菜品
</p>
    <MenuCategoryBlock v-for="(cat, index) in categories" :key="cat.id"
      :category="cat" :cart-map="cartMap" :is-last="index === categories.length - 1" @add="(food, specs, rect) => emit('add', food, specs, rect)"
      @decrease="emit('decrease', $event)" @load="(id, retry) => emit('load-category', id, retry)" />
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
</style>
