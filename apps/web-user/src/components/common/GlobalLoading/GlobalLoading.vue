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
  background: rgb(255 255 255 / 55%);
  backdrop-filter: blur(2px);
}

.global-loading__box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 116px;
  min-height: 96px;
  background: rgb(255 255 255 / 96%);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 12%);
}

.global-loading__text {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
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
