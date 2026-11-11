<script setup>
/** 留档的插槽布局，当前 FormInput 已内联它；重新接入见 docs/engineering/018-uni-user-address-form-extras.md。 */
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
