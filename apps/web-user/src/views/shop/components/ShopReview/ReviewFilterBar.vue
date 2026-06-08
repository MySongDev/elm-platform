<!-- components/ShopReview/ReviewFilterBar.vue -->
<script setup>
defineProps({
  filters: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['update:modelValue'])

function selectFilter(key) {
  emit('update:modelValue', key)
}
</script>

<template>
  <div class="filter-bar">
    <div v-for="item in filters" :key="item._id" class="filter-tag" :class="{ active: modelValue === item.name }"
      @click="selectFilter(item.name)">
      <span> {{ item.name }}</span>
      <span>({{ item.count }})</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 2.4vw;
  padding: 3.2vw 3.2vw 2.4vw;
  background: #fff;
}

.filter-tag {
  display: inline-flex;
  gap: 1vw;
  align-items: center;
  padding: 1.6vw 3.2vw;
  font-size: 3.2vw;
  color: #666;
  white-space: nowrap;
  cursor: pointer;
  background: #f5f5f5;
  border-radius: 20px;
  transition: all 0.2s;

  &.active {
    font-weight: 600;
    color: #ff8c00;
    background: #fff8e6;
  }

  .filter-icon {
    font-size: 3vw;
  }
}
</style>
