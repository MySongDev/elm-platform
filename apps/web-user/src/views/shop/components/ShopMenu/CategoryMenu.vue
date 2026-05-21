<!-- CategoryMenu.vue -->
<script setup>
import { nextTick, ref, watch } from 'vue'
import { getImageUrl } from '@/config'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  activeId: [Number, String],
})

const emit = defineEmits(['update:activeId'])

const menuRef = ref(null)

// ========== 自动滚动当前激活项到可视区域 ==========
watch(
  () => props.activeId,
  (newId, oldId) => {
    if (newId == null || newId === oldId)
      return

    nextTick(() => {
      const menuEl = menuRef.value
      const activeEl = menuEl?.querySelector('.cat-item.active')
      if (!menuEl || !activeEl)
        return

      const menuRect = menuEl.getBoundingClientRect()
      const activeRect = activeEl.getBoundingClientRect()

      const relativeTop
        = activeRect.top - menuRect.top - menuEl.clientTop + menuEl.scrollTop
      const target = relativeTop - (menuEl.clientHeight - activeEl.clientHeight) / 2

      menuEl.scrollTo({
        top: Math.max(0, target),
        behavior: 'smooth',
      })
    })
  },
  { flush: 'post' },
)
</script>

<template>
  <aside ref="menuRef" class="category-menu">
    <div v-for="(cat, index) in categories" :key="cat.id ?? cat._id ?? index" class="cat-item"
      :class="{ active: String(activeId) === String(cat.id) }" @click="emit('update:activeId', cat.id)">
      <div class="cat-content" :class="{ row: cat.icon_url }">
        <img v-if="cat.icon_url" :src="getImageUrl(cat.icon_url)" class="cat-icon" alt="">
        <span class="cat-name">{{ cat.name }}</span>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.category-menu {
  width: 80px;
  background: $ff;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;

  &::-webkit-scrollbar {
    display: none;
  }

  .cat-item {
    padding: 14px;
    font-size: 12px;
    transition: all 0.2s;
    line-height: 1.25;
    cursor: pointer;
    position: relative;
    color: #666;

    .cat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      &.row {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    .cat-icon {
      width: 18px;
      height: 18px;
      object-fit: cover;
    }

    .cat-hint {
      font-size: 12px;
      color: #ff6c4f;
    }

    .cat-name {
      word-break: break-all;
      text-align: center;
    }

    &.active {
      color: #111920;
      font-weight: 700;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 35%;
        width: 3px;
        height: 50%;
        background: #ffbd27;
        border-radius: 0 4px 4px 0;
      }
    }
  }
}
</style>
