<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/Skeleton/SkeletonBlock.vue 同源改造。
 *
 * ★ 差异（议题 4 ③ 类边界的手工处理点）：web-user 的 `normalizeSize` 给数字补 `px`，
 * 且 28 处模板属性写的是 `"32px"` 字符串。uni-user 统一 **rpx**：
 * - 数字 prop → 补 `rpx`（375 基准 ×2，故调用方的数字语义从 px 变 rpx）
 * - 字符串 prop → 原样透传（调用方应直接写 rpx，见 ShopListSkeleton）
 * ⚠️ 骨架屏尺寸必须与真实内容一致，否则切换时跳动 —— 所以这里的 rpx 值
 * 要与 ShopItem 的真实尺寸对齐（64px → 128rpx 等）。
 */
import { computed } from 'vue'

const props = defineProps({
  width: {
    type: [Number, String],
    default: '100%',
  },
  height: {
    type: [Number, String],
    default: 32,
  },
  radius: {
    type: [Number, String],
    default: 8,
  },
  circle: Boolean,
})

function normalizeSize(value) {
  return typeof value === 'number' ? `${value}rpx` : value
}

const blockStyle = computed(() => {
  const size = {
    width: normalizeSize(props.width),
    height: normalizeSize(props.height),
  }
  if (props.circle) {
    return {
      ...size,
      borderRadius: '50%',
      flex: `0 0 ${normalizeSize(props.width)}`,
    }
  }

  return {
    ...size,
    borderRadius: normalizeSize(props.radius),
  }
})
</script>

<template>
  <view
    class="skeleton-block"
    :style="blockStyle"
  />
</template>

<style lang="scss" scoped>
@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.skeleton-block {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background: #f1f2f5;
}

/* ⚠️ ::after 伪元素在小程序端支持有限（部分基础库版本不渲染）。
   shimmer 光效若真机不显示，骨架仍是静态灰块（可接受的降级），不阻塞功能。 */
.skeleton-block::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 70%), transparent);
  transform: translateX(-100%);
  animation: skeleton-shimmer 1.4s infinite;
}
</style>
