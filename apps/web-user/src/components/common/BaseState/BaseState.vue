<script setup>
import DefaultEmpty from './common/DefaultEmpty.vue'
import DefaultError from './common/DefaultError.vue'
import DefaultLoading from './common/DefaultLoading.vue'

defineProps({
  state: {
    type: String,
    default: '', // '' (初始) | loading | error | empty | success
  },
})

defineEmits(['retry'])

// 只有在非成功、非初始状态下，才需要展示遮罩层并锁定最小高度
// const showOverlay = computed(() => ['loading', 'error', 'empty'].includes(props.state))
</script>

<template>
  <div class="state-container" :class="{ 'is-active': state !== '' }">
    <!-- 成功状态内容（始终渲染，通过 v-show 控制显示） -->
    <div v-show="state === 'success'" class="state-content">
      <slot />
    </div>

    <!-- 过渡动画依然保留在包裹层上 -->
    <transition name="fade">
      <!-- 覆盖层容器：当处于非成功状态且非空时显示 -->
      <div v-show="state && state !== 'success'" class="state-overlay">
        <!-- 加载中 -->
        <div v-show="state === 'loading'" class="overlay-loading">
          <slot name="loading">
            <DefaultLoading />
          </slot>
        </div>

        <!-- 错误 -->
        <div v-show="state === 'error'" class="overlay-error">
          <slot name="error">
            <DefaultError @retry="$emit('retry')" />
          </slot>
        </div>

        <!-- 空数据 -->
        <div v-show="state === 'empty'" class="overlay-empty">
          <slot name="empty">
            <DefaultEmpty />
          </slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.state-container {
  /* 默认没有任何样式，高度为 0 */
  position: relative;
  transition: min-height 0.3s ease;
}

/* 只有当状态被激活时，才赋予最小高度 */
.state-container.is-active {
  min-height: 120px;
}

.state-content {
  height: 100%;
}

.state-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;

  /* 现代属性：top/left/right/bottom 全为 0 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
