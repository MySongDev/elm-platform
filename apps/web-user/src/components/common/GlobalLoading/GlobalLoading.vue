<script setup>
import { useLoadingStore } from '@/stores/modules/store-loading'

const loadingStore = useLoadingStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="global-loading">
      <div v-if="loadingStore.isLoading" class="global-loading" role="status" aria-live="polite">
        <div class="global-loading__box">
          <van-loading color="#2395ff" size="28px" />
          <p class="global-loading__text">
            {{ loadingStore.text }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.global-loading {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(2px);
}

.global-loading__box {
  display: flex;
  min-width: 116px;
  min-height: 96px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.global-loading__text {
  margin-top: 10px;
  color: #333;
  font-size: 14px;
}

.global-loading-enter-active,
.global-loading-leave-active {
  transition: opacity 0.18s ease;
}

.global-loading-enter-from,
.global-loading-leave-to {
  opacity: 0;
}
</style>
