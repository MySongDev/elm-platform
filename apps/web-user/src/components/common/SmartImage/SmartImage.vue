<script setup>
import { useTemplateRef } from 'vue'
import { IMAGE_PRIORITY } from '@/config/imageLoading'
import { useSmartImage } from './useSmartImage'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  eager: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: Number,
    default: IMAGE_PRIORITY.NORMAL,
  },
  skeleton: {
    type: Boolean,
    default: true,
  },
  progressive: {
    type: Boolean,
    default: true,
  },
  rootMargin: {
    type: String,
    default: '0px 0px 200px 0px',
  },
  loadDelay: {
    type: Number,
    default: 150,
  },
})

const emit = defineEmits(['load', 'error'])

const rootEl = useTemplateRef('rootEl')
const imgEl = useTemplateRef('imgEl')

const { loaded, failed } = useSmartImage({
  src: () => props.src,
  eager: () => props.eager,
  priority: () => props.priority,
  rootMargin: () => props.rootMargin,
  loadDelay: () => props.loadDelay,
  rootEl,
  imgEl,
  onLoad: payload => emit('load', payload),
  onError: payload => emit('error', payload),
})
</script>

<template>
  <div ref="rootEl" class="smart-img">
    <div v-if="skeleton && !loaded && !failed" class="smart-img__skeleton" aria-hidden="true" />

    <img v-show="!failed" ref="imgEl" :alt="alt" decoding="async" class="smart-img__img" :class="{
      'smart-img__img--progressive': progressive,
      'is-loaded': loaded,
    }">

    <div v-if="failed" class="smart-img__broken" role="img" :aria-label="alt">
      加载失败
    </div>
  </div>
</template>

<style lang="scss" scoped>
.smart-img {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  vertical-align: middle;
}

.smart-img__skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: smart-img-shimmer 1.1s ease-in-out infinite;
}

@keyframes smart-img-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.smart-img__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.smart-img__img--progressive:not(.is-loaded) {
  filter: blur(10px);
  transform: scale(1.04);
}

.smart-img__img--progressive.is-loaded {
  filter: none;
  transition:
    filter 0.35s ease,
    transform 0.35s ease;
  transform: none;
}

.smart-img__broken {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 48px;
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
}
</style>
