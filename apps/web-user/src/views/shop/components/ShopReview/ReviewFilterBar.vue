<!-- components/ShopReview/ReviewFilterBar.vue -->
<script setup>
const props = defineProps({
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
  align-items: center;
  gap: 1vw;
  padding: 1.6vw 3.2vw;
  border-radius: 20px;
  font-size: 3.2vw;
  color: #666;
  background: #f5f5f5;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #fff8e6;
    color: #ff8c00;
    font-weight: 600;
  }

  .filter-icon {
    font-size: 3vw;
  }
}
</style>
