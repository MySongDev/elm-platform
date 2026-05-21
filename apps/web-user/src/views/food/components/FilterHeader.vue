<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: String,
  showDropdown: Boolean,
  categoryName: String,
})
const emit = defineEmits(['toggle'])

const tabs = computed(() => [
  { key: 'category', label: props.categoryName || '分类' },
  { key: 'sort', label: '排序' },
  { key: 'filter', label: '筛选' },
])
</script>

<template>
  <div class="filter-header">
    <div
      v-for="tab in tabs" :key="tab.key" class="filter-tab"
      :class="{ active: activeTab === tab.key && showDropdown }" @click="emit('toggle', tab.key)"
    >
      <span class="tab-text">{{ tab.label }}</span>
      <span class="tab-arrow" :class="{ rotate: activeTab === tab.key && showDropdown }">▼</span>
    </div>
  </div>
</template>

<style scoped>
.filter-header {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  position: relative;
  z-index: 101;
}

.filter-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.filter-tab:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 20px;
  background: #e5e5e5;
}

.filter-tab.active {
  color: #409EFF;
  font-weight: 500;
}

.tab-text {
  margin-right: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-arrow {
  font-size: 10px;
  color: #999;
  transition: transform 0.3s;
}

.tab-arrow.rotate {
  transform: rotate(180deg);
}
</style>
