<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/SmartImage/SmartImage.vue 同源改造，
 * 但**调度模型重写**（迁移方案 D3 / Batch 2 第 7 项）。
 *
 * web-user 的机制：IntersectionObserver 判可视 + 停留时间 → 并发队列 → `<img>` 手动赋 src。
 *
 * 小程序端不使用浏览器的 IntersectionObserver，懒加载交给原生 `<image lazy-load>`。
 * ⚠️ 不能再叠加「赋 src 前占并发名额，load/error 后释放」的 JS 队列：离屏或隐藏的
 * image 可能不发请求，也就不归还名额；占满后连新页面的首屏图都拿不到 src。
 * 2026-11-08 移除该队列依赖，调度器留档在 utils/image/extras，见工程指南 014。
 *
 * loadDelay 只延迟绑定 src，错开首屏请求峰；eager 同时跳过延迟并关闭原生懒加载。
 * pkg-shop/components/ShopHeader.vue 使用 eager，其他调用方继续由原生判断何时下载。
 * 2026-11-06 已删除无调用方的 priority、候选 origin 回退和对外 load/error 事件。
 */
import { onScopeDispose, shallowRef, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  /** 跳过延迟并关闭原生懒加载（首屏关键图） */
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

let delayTimer = null

// 换源或卸载时只撤掉尚未绑定 src 的定时器，不声称能取消原生 image 已发出的请求。
function clearPending() {
  if (delayTimer !== null) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
}

function settle(ok) {
  loaded.value = ok
  failed.value = !ok
}

function start() {
  clearPending()
  loaded.value = false
  failed.value = false
  currentSrc.value = ''

  if (!props.src) {
    failed.value = true
    return
  }

  if (props.eager) {
    currentSrc.value = props.src
    return
  }

  // 只推迟绑定地址；何时下载由原生 lazy-load 决定，不为等待可见的图片占 JS 名额。
  delayTimer = setTimeout(() => {
    delayTimer = null
    currentSrc.value = props.src
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

    <!-- 没有地址时不创建 image，避免 v-show 在 mp 端转成 hidden 后被 display:block 覆盖。
         image 组件无 alt 属性（HTML 专属），无障碍语义用 aria-label。 -->
    <image
      v-if="!failed && currentSrc"
      class="smart-img__img"
      :class="{
        'smart-img__img--progressive': progressive,
        'is-loaded': loaded,
      }"
      :src="currentSrc"
      :aria-label="alt"
      mode="aspectFill"
      :lazy-load="!eager"
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
