<script setup>
defineProps({
  text: { type: String, default: '加载中...' },
  size: { type: String, default: '24px' },
})
</script>

<template>
  <div class="local-loading" role="status" aria-live="polite">
    <van-loading :size="size" color="#2395ff" />
    <span class="local-loading__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.local-loading {
  display: flex;
  min-height: 96px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.local-loading__text {
  margin-top: 8px;
}
</style>
