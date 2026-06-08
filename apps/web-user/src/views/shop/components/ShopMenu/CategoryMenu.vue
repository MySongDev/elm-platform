<!-- CategoryMenu.vue -->
<script setup>
import { nextTick, ref, watch } from 'vue'
import { getImageUrl } from '@/config'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
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
  overflow: hidden auto;
  overscroll-behavior-y: contain;
  background: $ff;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  .cat-item {
    position: relative;
    padding: 14px;
    font-size: 12px;
    line-height: 1.25;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;

    .cat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;

      &.row {
        flex-flow: row wrap;
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
      text-align: center;
      word-break: break-all;
    }

    &.active {
      font-weight: 700;
      color: #111920;

      &::before {
        position: absolute;
        top: 35%;
        left: 0;
        width: 3px;
        height: 50%;
        content: '';
        background: #ffbd27;
        border-radius: 0 4px 4px 0;
      }
    }
  }
}
</style>
