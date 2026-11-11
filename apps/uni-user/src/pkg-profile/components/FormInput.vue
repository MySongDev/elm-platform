<script setup>
/** 地址页的输入表单项；只管输入与展示，校验规则和保存仍由页面负责。 */

// 小程序编译器不支持 v-bind="$attrs"；新增输入属性要在这里声明，并在 input 上逐项绑定。
defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  // 调用方不传长度时明确给 -1（不限制），不要把空值继续绑定到小程序 input。
  maxlength: {
    type: Number,
    default: -1,
  },
  optional: Boolean,
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'input', 'blur'])

/** 先回填 v-model，再通知页面校验；两种事件都交付字符串，不暴露原生事件结构。 */
function onInput(e) {
  const value = e.detail.value
  emit('update:modelValue', value)
  emit('input', value)
}

function onBlur(e) {
  emit('blur', e.detail.value)
}
</script>

<template>
  <view class="form-item" :class="{ 'has-error': error }">
    <text v-if="label" class="form-item_label">
      {{ label }}
    </text>
    <view class="form-item_body">
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxlength"
        class="form-input"
        :class="{ 'form-input_optional': optional }"
        @input="onInput"
        @blur="onBlur"
      >
      <text v-if="optional" class="form-input_tag">
        选填
      </text>
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
    display: block;
    padding-left: 8rpx;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: #ff4d4f;
  }

  &.has-error {
    background: #fff2f0;
    border-color: #ff4d4f;
  }
}

.form-input {
  box-sizing: border-box;
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  background: #fff;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
  transition: all 0.3s;

  &:focus {
    border-color: #1890ff;
  }

  &_optional {
    padding-right: 136rpx;
  }
}

.form-item.has-error .form-input {
  border-color: #ff4d4f;
}

.form-input_tag {
  position: absolute;
  top: 50%;
  right: 24rpx;
  padding: 4rpx 16rpx;
  font-size: 24rpx;
  color: #999;
  pointer-events: none;
  background: #f5f5f5;
  border-radius: 20rpx;
  transform: translateY(-50%);
}
</style>
