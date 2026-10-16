<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/add/components/FormItemWrapper.vue 同源改造。
 *
 * 差异：
 * 1. div/label → view/text（小程序无 label 元素，标签语义只靠视觉）
 * 2. `&nbsp;` 等 HTML 实体不可用（web-user 原文未用，无此项）
 * 3. px → rpx（×2）
 */
defineProps({
  label: String,
  error: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <view class="form-item" :class="{ 'has-error': error }">
    <text v-if="label" class="form-item_label">
      {{ label }}
    </text>
    <view class="form-item_body">
      <slot />
    </view>
    <text v-if="error" class="form-item_error">
      {{ error }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.form-item {
  padding: 24rpx 32rpx;
  margin-bottom: 4rpx;
  background: #fff;
  border: 2rpx solid transparent;
  transition: all 0.3s;

  &.has-error {
    background: #fff2f0;
    border-color: #ff4d4f;
  }

  &_label {
    display: block;
    margin-bottom: 16rpx;
    font-size: 28rpx;
    color: #666;
  }

  &_body {
    position: relative;
  }

  &_error {
    padding-left: 8rpx;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #ff4d4f;
  }
}
</style>
