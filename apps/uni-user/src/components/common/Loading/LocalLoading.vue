<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/Loading/LocalLoading.vue 同源改造。
 * 差异：van-loading → 纯 CSS spinner（小程序端不引 Vant；uni-ui 的 load-more 语义不符）。
 * CSS animation 在小程序端支持良好。
 */
defineProps({
  text: {
    type: String,
    default: '加载中...',
  },
  size: {
    type: String,
    default: '48rpx',
  },
})
</script>

<template>
  <view
    class="local-loading"
    role="status"
    aria-live="polite"
  >
    <view
      class="local-loading__spinner"
      :style="{ width: size, height: size }"
    />
    <text class="local-loading__text">
      {{ text }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.local-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 192rpx;
  font-size: 28rpx;
  color: #999;
}

/* 纯 CSS 旋转环：border 三色透明 + 一边着色，animation 旋转 */
.local-loading__spinner {
  box-sizing: border-box;
  border: 4rpx solid rgb(35 149 255 / 25%);
  border-top-color: #2395ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.local-loading__text {
  margin-top: 16rpx;
}
</style>
