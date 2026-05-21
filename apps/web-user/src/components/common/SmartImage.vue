<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IMAGE_PRIORITY } from '@/config/imageLoading'
import { buildImageCandidateUrls } from '@/utils/imageCandidates'
import { scheduleImageTask } from '@/utils/imageLoadScheduler'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  /** 跳过可视判断，立即参与调度 */
  eager: { type: Boolean, default: false },
  /** 数值越小越先加载 */
  priority: { type: Number, default: IMAGE_PRIORITY.NORMAL },
  skeleton: { type: Boolean, default: true },
  /** 加载完成前模糊，完成后过渡清晰 */
  progressive: { type: Boolean, default: true },
  rootMargin: { type: String, default: '0px 0px 200px 0px' },
  /**
   * IO 触发后延迟多久才真正调度加载（ms）。
   * 快速滑过的图片在此期间离开视口会被取消，避免发起无效请求。
   */
  loadDelay: { type: Number, default: 150 },
})

const emit = defineEmits(['load', 'error'])

const rootEl = ref(null)
const imgEl = ref(null)

const candidates = computed(() => buildImageCandidateUrls(props.src))
const candidateIndex = ref(0)
const loaded = ref(false)
const failed = ref(false)

let io = null
let cancelSchedule = null
let delayTimer = null

function cleanupObserver() {
  if (io && rootEl.value) {
    io.unobserve(rootEl.value)
    io.disconnect()
  }
  io = null
}

function cleanupSchedule() {
  if (cancelSchedule) {
    cancelSchedule()
    cancelSchedule = null
  }
}

function cleanupDelayTimer() {
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
}

function attachLoadHandlers(img, url, release) {
  img.onload = () => {
    img.onload = img.onerror = null
    loaded.value = true
    failed.value = false
    emit('load', { src: url })
    release()
  }
  img.onerror = () => {
    img.onload = img.onerror = null
    release()
    const next = candidateIndex.value + 1
    if (next < candidates.value.length) {
      candidateIndex.value = next
      runLoadAttempt()
    }
    else {
      failed.value = true
      emit('error', { src: url })
    }
  }
}

function runLoadAttempt() {
  cleanupSchedule()
  const url = candidates.value[candidateIndex.value]
  if (!url) {
    failed.value = true
    emit('error', { src: props.src })
    return
  }

  const img = imgEl.value
  if (!img)
    return

  cancelSchedule = scheduleImageTask({
    priority: props.priority,
    run(release) {
      attachLoadHandlers(img, url, release)
      img.src = url
    },
  })
}

function startWhenVisible() {
  cleanupDelayTimer()

  if (props.eager) {
    runLoadAttempt()
    return
  }

  if (!rootEl.value)
    return

  cleanupObserver()
  io = new IntersectionObserver(
    (entries) => {
      const hit = entries.some(e => e.isIntersecting)
      if (!hit) {
        // 离开视口：取消 delay 和调度，不发请求
        cleanupDelayTimer()
        cleanupSchedule()
        return
      }

      // 进入视口：延迟后再做一次确认，防止快速滑过
      cleanupObserver()
      delayTimer = setTimeout(() => {
        delayTimer = null
        // 延迟结束后再次检查：DOM 可能已被卸载或已离开视口
        if (!rootEl.value)
          return
        runLoadAttempt()
      }, props.loadDelay)
    },
    { rootMargin: props.rootMargin, threshold: 0.01 },
  )
  io.observe(rootEl.value)
}

watch(
  () => props.src,
  () => {
    cleanupDelayTimer()
    cleanupSchedule()
    candidateIndex.value = 0
    loaded.value = false
    failed.value = false
    if (imgEl.value) {
      imgEl.value.removeAttribute('src')
      imgEl.value.onload = imgEl.value.onerror = null
    }
    nextTick(() => startWhenVisible())
  },
)

watch(
  () => [props.eager, props.priority],
  () => {
    if (loaded.value)
      return
    nextTick(() => startWhenVisible())
  },
)

onBeforeUnmount(() => {
  cleanupDelayTimer()
  cleanupSchedule()
  cleanupObserver()
})

onMounted(() => {
  nextTick(() => startWhenVisible())
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
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  width: 100%;
  height: 100%;
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
  transform: none;
  transition:
    filter 0.35s ease,
    transform 0.35s ease;
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
