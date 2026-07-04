<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IMAGE_PRIORITY, IMAGE_VIEWPORT_PRIORITY_OFFSET } from '@/config/imageLoading'
import { buildImageCandidateUrls } from '@/utils/image/imageCandidates'
import { scheduleImageTask } from '@/utils/image/imageLoadScheduler'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  /** 跳过可视判断，立即参与调度 */
  eager: {
    type: Boolean,
    default: false,
  },
  /** 数值越小越先加载 */
  priority: {
    type: Number,
    default: IMAGE_PRIORITY.NORMAL,
  },
  skeleton: {
    type: Boolean,
    default: true,
  },
  /** 加载完成前模糊，完成后过渡清晰 */
  progressive: {
    type: Boolean,
    default: true,
  },
  rootMargin: {
    type: String,
    default: '0px 0px 200px 0px',
  },
  /**
   * IO 触发后延迟多久才真正调度加载（ms）。
   * 快速滑过的图片在此期间离开视口会被取消，避免发起无效请求。
   */
  loadDelay: {
    type: Number,
    default: 150,
  },
})

const emit = defineEmits(['load', 'error'])

const rootEl = ref(null)
const imgEl = ref(null)

const candidates = computed(() => buildImageCandidateUrls(props.src))
const candidateIndex = ref(0)
const loaded = ref(false)
const failed = ref(false)

let preloadObserver = null
let viewportObserver = null
let imageTask = null
let delayTimer = null

// 状态跟踪
let inPreloadZone = false
let inViewport = false
let requestStarted = false

function cleanupObservers() {
  if (preloadObserver && rootEl.value) {
    preloadObserver.unobserve(rootEl.value)
    preloadObserver.disconnect()
  }
  if (viewportObserver && rootEl.value) {
    viewportObserver.unobserve(rootEl.value)
    viewportObserver.disconnect()
  }
  preloadObserver = null
  viewportObserver = null
}

function cleanupSchedule() {
  if (imageTask) {
    imageTask = null
  }
}

function cancelTask() {
  if (imageTask) {
    imageTask.cancel()
    imageTask = null
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

function runLoadAttempt(priority) {
  if (requestStarted)
    return

  cancelTask()
  const url = candidates.value[candidateIndex.value]
  if (!url) {
    failed.value = true
    emit('error', { src: props.src })
    return
  }

  const img = imgEl.value
  if (!img)
    return

  requestStarted = true
  imageTask = scheduleImageTask({
    priority: priority ?? props.priority,
    run(release) {
      attachLoadHandlers(img, url, release)
      img.src = url
    },
  })
}

function scheduleCurrentCandidate(priority) {
  if (imageTask) {
    imageTask.updatePriority(priority)
    return
  }

  const url = candidates.value[candidateIndex.value]
  if (!url) {
    failed.value = true
    emit('error', { src: props.src })
    return
  }

  const img = imgEl.value
  if (!img)
    return

  imageTask = scheduleImageTask({
    priority,
    run(release) {
      attachLoadHandlers(img, url, release)
      img.src = url
    },
  })
}

function getPreloadPriority() {
  return inViewport ? props.priority + IMAGE_VIEWPORT_PRIORITY_OFFSET : props.priority
}

function onPreloadZoneChange(hit) {
  inPreloadZone = hit

  if (hit) {
    // 首次进入预加载区：启动延迟
    cleanupDelayTimer()

    if (props.eager || !props.loadDelay) {
      if (inViewport) {
        runLoadAttempt(getPreloadPriority())
      }
      else {
        scheduleCurrentCandidate(getPreloadPriority())
      }
      return
    }

    delayTimer = setTimeout(() => {
      delayTimer = null
      if (inPreloadZone && !requestStarted) {
        scheduleCurrentCandidate(getPreloadPriority())
      }
    }, props.loadDelay)
  }
  else {
    // 离开预加载区：取消延迟和尚未执行的任务
    cleanupDelayTimer()
    if (!requestStarted) {
      cancelTask()
    }
  }
}

function onViewportChange(hit) {
  inViewport = hit

  if (hit) {
    // 进入真实视口：取消延迟，立即提升优先级
    cleanupDelayTimer()

    if (!requestStarted) {
      if (imageTask) {
        imageTask.updatePriority(props.priority + IMAGE_VIEWPORT_PRIORITY_OFFSET)
      }
      else {
        runLoadAttempt(props.priority + IMAGE_VIEWPORT_PRIORITY_OFFSET)
      }
    }
  }
  else {
    // 离开真实视口但仍在预加载区：降级
    if (imageTask && !requestStarted) {
      imageTask.updatePriority(props.priority)
    }
  }
}

function startWhenVisible() {
  cleanupDelayTimer()

  if (props.eager) {
    runLoadAttempt(props.priority)
    return
  }

  if (!rootEl.value)
    return

  if (typeof IntersectionObserver !== 'function') {
    runLoadAttempt(props.priority)
    return
  }

  cleanupObservers()

  // 预加载区观察器
  preloadObserver = new IntersectionObserver(
    (entries) => {
      const hit = entries.some(e => e.isIntersecting)
      onPreloadZoneChange(hit)
    },
    {
      rootMargin: props.rootMargin,
      threshold: 0.01,
    },
  )
  preloadObserver.observe(rootEl.value)

  // 真实视口观察器
  viewportObserver = new IntersectionObserver(
    (entries) => {
      const hit = entries.some(e => e.isIntersecting)
      onViewportChange(hit)
    },
    {
      rootMargin: '0px',
      threshold: 0.01,
    },
  )
  viewportObserver.observe(rootEl.value)
}

watch(
  () => props.src,
  () => {
    cleanupDelayTimer()
    cancelTask()
    cleanupObservers()
    requestStarted = false
    inPreloadZone = false
    inViewport = false
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
  cancelTask()
  cleanupObservers()
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
