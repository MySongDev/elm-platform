<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/add/components/SexSelector.vue 同源改造。
 *
 * 差异：
 * 1. `<input type="radio">` 是纯视觉占位（label 包裹），小程序端删掉，直接用
 *    view + @click 触发选中 —— 语义等价（web-user 原文的 radio 只是给 CSS :checked
 *    选择器用的，无原生行为）
 * 2. CSS `animation: popIn` 关键帧小程序支持度存疑 → 简化为直接显示 ✓ 徽章
 *    （不带动画，功能等价）
 * 3. px → rpx
 */
import FormItemWrapper from './FormItemWrapper.vue'

defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'field-change'])

const options = [
  {
    value: 1,
    label: '男',
    icon: '👨',
  },
  {
    value: 2,
    label: '女',
    icon: '👩',
  },
]

function onChange(value) {
  emit('update:modelValue', value)
  emit('field-change', value)
}
</script>

<template>
  <FormItemWrapper label="性别" :error="error">
    <view class="sex-group">
      <view
        v-for="opt in options"
        :key="opt.value"
        class="sex-option"
        :class="{ active: modelValue === opt.value }"
        @click="onChange(opt.value)"
      >
        <view class="sex-option_content">
          <text class="sex-option_icon">
            {{ opt.icon }}
          </text>
          <text class="sex-option_text">
            {{ opt.label }}
          </text>
          <text v-if="modelValue === opt.value" class="sex-option_check">
            ✓
          </text>
        </view>
      </view>
    </view>
  </FormItemWrapper>
</template>

<style lang="scss" scoped>
.sex-group {
  display: flex;
  gap: 32rpx;
}

.sex-option {
  flex: 1;

  &_content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-height: 110rpx;
    background: #f8f9fa;
    border: 4rpx solid #e9ecef;
    border-radius: 32rpx;
    transition: all 0.3s;
  }

  &.active &_content {
    background: #e6f7ff;
    border-color: #1890ff;
  }

  &_icon {
    font-size: 50rpx;
  }

  &.active &_icon {
    transform: scale(1.1);
  }

  &_text {
    font-size: 32rpx;
    font-weight: 500;
    color: #495057;
  }

  &.active &_text {
    font-weight: 600;
    color: #1890ff;
  }

  &_check {
    position: absolute;
    top: 4rpx;
    right: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48rpx;
    height: 48rpx;
    font-size: 28rpx;
    font-weight: bold;
    color: white;
    background: #1890ff;
    border-radius: 50%;
  }
}
</style>
