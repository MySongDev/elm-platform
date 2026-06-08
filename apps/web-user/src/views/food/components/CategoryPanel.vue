<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  activeIndex: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['select-category', 'select-sub'])

const activeCategory = computed(() => props.categories[props.activeIndex] || null)
const currentSubCategories = computed(() => {
  return activeCategory.value?.sub_categories?.filter(item => item.level === 2) || []
})

function handleCategoryClick(index) {
  const category = props.categories[index]
  if (category)
    emit('select-category', category)
}

function handleSubClick(sub) {
  if (!activeCategory.value)
    return

  emit('select-sub', {
    parent: activeCategory.value,
    sub,
  })
}

function formatCount(count) {
  return count > 999 ? '999+' : count
}

function getImageUrl(filename) {
  if (!filename)
    return ''
  if (/^https?:\/\//.test(filename))
    return filename
  return `https://fuss10.elemecdn.com/${filename}`
}
</script>

<template>
  <div class="category-panel">
    <!-- 左侧一级分类 -->
    <div class="cat-sidebar">
      <div
        v-for="(item, index) in categories" :key="item.id" class="cat-item"
        :class="{ active: activeIndex === index }" @click="handleCategoryClick(index)"
      >
        <img v-if="item.image_url" :src="getImageUrl(item.image_url)" class="cat-icon" alt="">
        <span class="cat-name">{{ item.name }}</span>
        <div class="cat-meta">
          <span v-if="item.count > 0" class="cat-count">{{ formatCount(item.count) }}</span>
          <span class="cat-arrow">›</span>
        </div>
      </div>
    </div>

    <!-- 右侧二级分类 -->
    <div class="cat-content">
      <div v-for="sub in currentSubCategories" :key="sub.id" class="sub-item" @click="handleSubClick(sub)">
        <div class="sub-info">
          <img v-if="sub.image_url" :src="getImageUrl(sub.image_url)" class="sub-icon" alt="">
          <span class="sub-name">{{ sub.name }}</span>
        </div>
        <span class="sub-count">{{ sub.count }}</span>
      </div>

      <!-- 空状态 -->
      <div v-if="currentSubCategories.length === 0" class="empty-state">
        <div class="empty-text">
          暂无子分类
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-panel {
  display: flex;
  height: 400px;
  background: #fff;
}

/* ========== 左侧边栏 ========== */
.cat-sidebar {
  flex-shrink: 0;
  width: 140px;
  overflow-y: auto;
  background: #f5f5f5;
  border-right: 1px solid #eee;
}

.cat-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-item.active {
  font-weight: 500;
  color: #2395ff;
  background: #fff;
}

.cat-item.active::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 16px;
  content: '';
  background: #2395ff;
  transform: translateY(-50%);
}

.cat-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  object-fit: contain;
}

.cat-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-meta {
  display: flex;
  gap: 2px;
  align-items: center;
}

.cat-count {
  min-width: 16px;
  padding: 1px 4px;
  font-size: 10px;
  color: #999;
  text-align: center;
  background: #e0e0e0;
  border-radius: 8px;
}

.cat-item.active .cat-count {
  color: #fff;
  background: #2395ff;
}

.cat-arrow {
  margin-left: 2px;
  font-size: 12px;
  color: #ccc;
}

/* ========== 右侧内容区 ========== */
.cat-content {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  background: #fff;
}

.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.sub-item:active {
  background: #f5f5f5;
}

.sub-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sub-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.sub-name {
  font-size: 14px;
  color: #333;
}

.sub-count {
  min-width: 30px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.empty-text {
  font-size: 14px;
}

/* 滚动条美化 */
.cat-sidebar::-webkit-scrollbar,
.cat-content::-webkit-scrollbar {
  display: none;
  width: 0;
}
</style>
