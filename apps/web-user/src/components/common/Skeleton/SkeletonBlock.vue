<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: [Number, String], default: '100%' },
  height: { type: [Number, String], default: 16 },
  radius: { type: [Number, String], default: 4 },
  circle: Boolean,
})

function normalizeSize(value) {
  return typeof value === 'number' ? `${value}px` : value
}

const blockStyle = computed(() => {
  const size = {
    width: normalizeSize(props.width),
    height: normalizeSize(props.height),
  }
  if (props.circle) {
    return {
      ...size,
      borderRadius: '50%',
      flex: `0 0 ${normalizeSize(props.width)}`,
    }
  }

  return {
    ...size,
    borderRadius: normalizeSize(props.radius),
  }
})
</script>

<template>
  <span class="skeleton-block" :style="blockStyle" />
</template>

<style scoped>
.skeleton-block {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: #f1f2f5;
}

.skeleton-block::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
  animation: skeleton-shimmer 1.4s infinite;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
