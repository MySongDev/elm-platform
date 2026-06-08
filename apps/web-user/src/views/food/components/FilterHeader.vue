<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: String,
  showDropdown: Boolean,
  categoryName: String,
})
const emit = defineEmits(['toggle'])

const tabs = computed(() => [
  {
    key: 'category',
    label: props.categoryName || '分类',
  },
  {
    key: 'sort',
    label: '排序',
  },
  {
    key: 'filter',
    label: '筛选',
  },
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
  position: relative;
  z-index: 101;
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
}

.filter-tab {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.filter-tab:not(:last-child)::after {
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: 20px;
  content: '';
  background: #e5e5e5;
  transform: translateY(-50%);
}

.filter-tab.active {
  font-weight: 500;
  color: #409EFF;
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
