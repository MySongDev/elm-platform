<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/SmartImage/SmartImage.vue 同源改造，
 * 但**调度模型重写**（迁移方案 D3 / Batch 2 第 7 项）。
 *
 * web-user 的机制：IntersectionObserver 判可视 + 停留时间 → 并发队列 → `<img>` 手动赋 src。
 *
 * 小程序端**没有可用于任意元素的 IntersectionObserver** → 退化路线：
 * - 懒加载交给 `<image lazy-load>`（小程序原生）
 * - 并发控制保留（imageLoadScheduler 端无关）
 * - loadDelay 退化为「挂载后延迟入队」，错开首屏请求峰
 *
 * 2026-11-06 精简（与 web-user 同步）：删掉 priority、候选 origin 回退、load/error 事件。
 * 三者均无调用方：priority 只有 ShopItem 传了默认值，回退列表默认为空，事件无人监听。
 * eager 保留：pkg-shop/components/ShopHeader.vue 用它让店铺头图跳过延迟。
 */
import { onScopeDispose, shallowRef, watch } from 'vue'

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
  /** 跳过延迟，立即进队列（首屏关键图） */
  eager: {
    type: Boolean,
    default: false,
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

const loaded = shallowRef(false)
const failed = shallowRef(false)
const currentSrc = shallowRef('')

let imageTask = null
let delayTimer = null
// run() 与 load/error 回调之间传递的并发槽释放句柄。
// ⚠️ 声明在 enqueue 之前：enqueue 的 run 闭包会写它（no-use-before-define）
let pendingRelease = null

// 撤掉延迟和排队中的任务；已赋 src 的那次加载也要归还名额，否则名额会一直被占着
function clearPending() {
  if (delayTimer !== null) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
  imageTask?.cancel()
  imageTask = null
  pendingRelease?.()
  pendingRelease = null
}

/**
 * 进并发队列。真正「加载」在小程序端是给 <image> 赋 src，
 * 由 image 组件自己发请求 —— 所以 run() 只负责赋值，release 在 load/error 回调里调。
 */
function enqueue() {
  if (loaded.value || failed.value || imageTask)
    return

  if (!props.src) {
    failed.value = true
    return
  }

  imageTask = scheduleImageTask({
    run(release) {
      currentSrc.value = props.src
      pendingRelease = release
    },
  })
}

function settle(ok) {
  pendingRelease?.()
  pendingRelease = null
  imageTask = null
  loaded.value = ok
  failed.value = !ok
}

function start() {
  clearPending()
  loaded.value = false
  failed.value = false
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
  () => props.eager,
  () => {
    if (!loaded.value)
      start()
  },
)

start()

onScopeDispose(clearPending)
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
      @load="settle(true)"
      @error="settle(false)"
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
