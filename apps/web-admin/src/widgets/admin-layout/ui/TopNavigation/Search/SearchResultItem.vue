<script setup lang="ts">
import type { SearchDisplayItem } from './types'
import type { FlatRoute } from '@/shared/lib/menu'
import { IconClock as IconEpClock } from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'GlobalSearchResultItem' })

const props = defineProps<{
  active: boolean
  item: SearchDisplayItem
}>()

const emit = defineEmits<{
  activate: []
  select: [item: SearchDisplayItem]
}>()

const isHistoryItem = computed(() => 'isHistory' in props.item && props.item.isHistory)
const routeItem = computed(() => isHistoryItem.value ? undefined : props.item as FlatRoute)
</script>

<template>
  <div
    class="global-search-result"
    :class="{ 'global-search-result--active': active }"
    role="option"
    :aria-selected="active"
    @click="emit('select', item)"
    @mouseenter="emit('activate')"
  >
    <template v-if="isHistoryItem">
      <el-icon class="global-search-result__icon">
        <IconEpClock />
      </el-icon>
      <span class="global-search-result__title">{{ item.title }}</span>
    </template>
    <template v-else>
      <el-icon v-if="routeItem?.icon" class="global-search-result__icon">
        <SvgIcon :icon-name="routeItem.icon" />
      </el-icon>
      <span class="global-search-result__title">{{ item.title }}</span>
      <span class="global-search-result__path">{{ item.path }}</span>
    </template>
  </div>
</template>

<style scoped lang="scss">
.global-search-result {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;

  &--active {
    background: rgba($primary-color, 0.08);
  }
}

.global-search-result__icon {
  flex-shrink: 0;
  font-size: 15px;
  color: $text-secondary;
}

.global-search-result__title {
  flex: 1;
  overflow: hidden;
  font-size: 14px;
  color: $text-primary;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-search-result__path {
  flex-shrink: 0;
  max-width: 45%;
  overflow: hidden;
  font-size: 12px;
  color: $text-placeholder;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width <= 520px) {
  .global-search-result {
    align-items: flex-start;
  }

  .global-search-result__path {
    display: none;
  }
}
</style>
