<script setup>
import { computed, toValue, watch } from 'vue'
import { useBackTop } from '@/composables/ui'

const props = defineProps({
  target: {
    type: Object,
    default: null,
  },
  threshold: {
    type: Number,
    default: 400,
  },
  showAfter: {
    type: [Object, String],
    default: null,
  },
  offset: {
    type: Number,
    default: 0,
  },
  right: {
    type: [Number, String],
    default: 16,
  },
  bottom: {
    type: [Number, String],
    default: 80,
  },
  ariaLabel: {
    type: String,
    default: '返回顶部',
  },
  behavior: {
    type: String,
    default: 'smooth',
  },
})

const { showBackTop, scrollToTop, setAnchor, setTarget } = useBackTop({
  threshold: () => props.threshold,
  showAfter: () => props.showAfter,
  offset: () => props.offset,
})

const positionStyle = computed(() => ({
  right: typeof props.right === 'number' ? `${props.right}px` : props.right,
  bottom: typeof props.bottom === 'number' ? `${props.bottom}px` : props.bottom,
}))

watch(
  () => toValue(props.target),
  (target) => {
    if (target)
      setTarget(target)
  },
  { immediate: true },
)

watch(
  () => toValue(props.showAfter),
  anchor => setAnchor(anchor),
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <Transition name="back-top-fade">
    <button
      v-show="showBackTop"
      type="button"
      class="back-top"
      :aria-label="ariaLabel"
      :style="positionStyle"
      @click="scrollToTop(behavior)"
    >
      <slot>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </slot>
    </button>
  </Transition>
</template>

<style lang="scss" scoped>
.back-top {
  position: fixed;
  z-index: var(--z-index-backtop, 100);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #666;
  cursor: pointer;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 12px rgb(0 0 0 / 12%);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease,
    box-shadow 0.2s ease;
  transform: translateZ(0);
  will-change: transform, opacity;

  &:hover {
    color: #333;
    box-shadow: 0 4px 16px rgb(0 0 0 / 16%);
  }

  &:active {
    transform: scale(0.92) translateZ(0);
  }
}

.back-top-fade-enter-active,
.back-top-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.back-top-fade-enter-from,
.back-top-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .back-top-fade-enter-active,
  .back-top-fade-leave-active {
    transition: none;
  }
}
</style>
