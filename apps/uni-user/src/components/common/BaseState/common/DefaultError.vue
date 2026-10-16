<script setup>
defineEmits(['retry'])
</script>

<template>
  <view class="error">
    <text>加载失败</text>
    <!-- ⚠️ button → view：小程序的 button 有默认边框/背景/尺寸，重置成本高；
         这里只是可点文本，view + @click 足够（web-user 用 button 是 H5 语义习惯） -->
    <view
      class="retry-btn"
      @click="$emit('retry')"
    >
      重试
    </view>
  </view>
</template>

<style lang="scss" scoped>
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.retry-btn {
  padding: 8rpx 20rpx;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #fff;
  background: #fb7299;
  border-radius: 8rpx;
}
</style>
