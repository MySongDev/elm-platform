<script setup>
defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: Number,
})
const emit = defineEmits(['update:modelValue', 'select'])

function handleSelect(value) {
  emit('update:modelValue', value)
  emit('select', value)
}
</script>

<template>
  <div class="sort-panel">
    <div
      v-for="opt in options" :key="opt.value" class="sort-item" :class="{ active: modelValue === opt.value }"
      @click="handleSelect(opt.value)"
    >
      <div class="sort-left">
        <span class="sort-icon" :style="{ color: opt.iconColor }">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
            <circle cx="12" cy="12" r="5" fill="currentColor" />
          </svg>
        </span>
        <span class="sort-text">{{ opt.text }}</span>
      </div>
      <span v-if="modelValue === opt.value" class="check-icon">✓</span>
    </div>
  </div>
</template>

<style scoped>
.sort-panel {
  background: #fff;
}

.sort-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.sort-item.active {
  color: #409EFF;
}

.sort-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.check-icon {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}
</style>
