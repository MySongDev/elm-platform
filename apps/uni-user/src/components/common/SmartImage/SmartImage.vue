<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/SmartImage/SmartImage.vue 同源改造，
 * 但**调度模型重写**（迁移方案 D3 / Batch 2 第 7 项，全组件层最难）。
 *
 * web-user 的机制：IntersectionObserver 判可视 → 视口内任务优先级提升 -100 →
 * 并发队列 → `<img>` 手动赋 src → 失败换候选 origin。
 *
 * 小程序端**没有可用于任意元素的 IntersectionObserver** → 按方案选定的退化路线：
 * - 懒加载交给 `<image lazy-load>`（小程序原生）
 * - 并发控制保留（imageLoadScheduler 端无关，队列逻辑本身有价值）
 * - **放弃「视口内提优先级」**（IMAGE_VIEWPORT_PRIORITY_OFFSET 废弃；
 *   是否恢复列入 Batch 5 O3，且要先评估收益 —— 小程序端复现可能性能更差）
 * - 候选回退保留（platform/image 的 buildImageCandidateUrls；
 *   ⚠️ uni-user 默认 fallback 为空数组，故默认单候选，回退逻辑是防御性的）
 *
 * 删除的 web-user 依赖：useSmartImage.js / useImageVisibilityPriority.js
 * （两者围绕 IntersectionObserver 与 useTemplateRef(Vue3.5 API)，整体作废）。
 *
 * 保留的对外 API：src / alt / eager / priority / skeleton / progressive / loadDelay
 * + load / error 事件 → 调用方（ShopItem 等）零改动。
 * ⚠️ rootMargin prop 移除：它是 IntersectionObserver 参数，小程序端无意义。
 * 调用方若传了会被 Vue 忽略（不报错），Batch 3 迁页面时顺手清理。
 */
import { onScopeDispose, shallowRef, watch } from 'vue'

import { IMAGE_PRIORITY } from '@/config'
import { buildImageCandidateUrls, nextImageCandidate } from '@/platform/image'
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
  /** 跳过懒加载与延迟，立即进队列（首屏关键图） */
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
  loadDelay: {
    type: Number,
    default: 150,
  },
})

const emit = defineEmits(['load', 'error'])

const loaded = shallowRef(false)
const failed = shallowRef(false)
const currentSrc = shallowRef('')
const candidateIndex = shallowRef(0)

let imageTask = null
let delayTimer = null
// run() 与 load/error 回调之间传递的并发槽释放句柄。
// ⚠️ 声明在 enqueue 之前：enqueue 的 run 闭包会写它（no-use-before-define）
let pendingRelease = null

function clearPending() {
  if (delayTimer !== null) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
  imageTask?.cancel()
  imageTask = null
}

/**
 * 进并发队列。真正「加载」在小程序端是给 <image> 赋 src，
 * 由 image 组件自己发请求 —— 所以 run() 只负责赋值，release 在 load/error 回调里调。
 */
function enqueue() {
  if (loaded.value || failed.value || imageTask)
    return

  const candidates = buildImageCandidateUrls(props.src)
  const url = candidates[candidateIndex.value]

  if (!url) {
    failed.value = true
    emit('error', { src: props.src })
    return
  }

  imageTask = scheduleImageTask({
    priority: props.priority,
    run(release) {
      currentSrc.value = url
      pendingRelease = release
    },
  })
}

function onLoad(event) {
  pendingRelease?.()
  pendingRelease = null
  imageTask = null
  loaded.value = true
  failed.value = false
  emit('load', event?.detail || { src: currentSrc.value })
}

function onError() {
  pendingRelease?.()
  pendingRelease = null
  imageTask = null

  // 候选回退：还有下一个候选就重试，否则判失败
  const next = nextImageCandidate(buildImageCandidateUrls(props.src), candidateIndex.value)
  if (next) {
    candidateIndex.value += 1
    enqueue()
    return
  }

  failed.value = true
  emit('error', { src: currentSrc.value })
}

function start() {
  clearPending()
  loaded.value = false
  failed.value = false
  candidateIndex.value = 0
  currentSrc.value = ''

  if (props.eager) {
    enqueue()
    return
  }

  // 非 eager：延迟入队，错开首屏请求峰（对齐 web-user 的 loadDelay 语义）
  delayTimer = setTimeout(() => {
    delayTimer = null
    enqueue()
  }, props.loadDelay)
}

watch(
  () => props.src,
  () => start(),
)
watch(
  () => [props.eager, props.priority],
  () => {
    if (!loaded.value)
      start()
  },
)

start()

onScopeDispose(() => {
  clearPending()
  pendingRelease?.()
  pendingRelease = null
})
</script>

<template>
  <view class="smart-img">
    <view
      v-if="skeleton && !loaded && !failed"
      class="smart-img__skeleton"
      aria-hidden="true"
    />

    <!-- ⚠️ lazy-load：小程序原生懒加载，替代 web-user 的 IntersectionObserver 调度。
         ⚠️ image 组件无 alt 属性（HTML 专属），无障碍语义用 aria-label -->
    <image
      v-show="!failed && currentSrc"
      class="smart-img__img"
      :class="{
        'smart-img__img--progressive': progressive,
        'is-loaded': loaded,
      }"
      :src="currentSrc"
      :aria-label="alt"
      mode="aspectFill"
      lazy-load
      @load="onLoad"
      @error="onError"
    />

    <view
      v-if="failed"
      class="smart-img__broken"
      role="img"
      :aria-label="alt"
    >
      加载失败
    </view>
  </view>
</template>

<style lang="scss" scoped>
@keyframes smart-img-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

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

.smart-img__img {
  display: block;
  width: 100%;
  height: 100%;
}

/* ⚠️ progressive 的 blur 渐进效果：小程序端 filter 支持有限，
   真机若不生效则退化为直接显示（可接受降级，不阻塞） */
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
  min-height: 96rpx;
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
}
</style>
