<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/add/components/FormInput.vue 同源改造。
 *
 * 差异：
 * 1. input 元素用小程序原生写法，事件名不变，但取值字段不同
 * 2. 原 inputmode 属性小程序端没有，改 type 为 idcard 即可
 * 3. form 的 submit 语义小程序端不存在，由父页面按钮点击兜住
 * 4. px 改 rpx
 */
import FormItemWrapper from './FormItemWrapper.vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  type: String,
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  maxlength: Number,
  optional: Boolean,
  error: {
    type: String,
    default: '',
  },
  /** 只读（「所在地区」等由 AreaPicker 单独承担的字段不需要走 FormInput） */
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'field-change', 'field-blur'])

function onInput(e) {
  const value = e.detail.value
  emit('update:modelValue', value)
  emit('field-change', value)
}

function onBlur(e) {
  emit('field-blur', e.detail.value)
}
</script>

<template>
  <FormItemWrapper :label="label" :error="error">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="readonly"
      :data-field="name"
      class="form-input"
      @input="onInput"
      @blur="onBlur"
    >
    <text v-if="optional" class="form-input_tag">
      选填
    </text>
  </FormItemWrapper>
</template>

<style lang="scss" scoped>
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
}

/* 小程序端组件默认 isolated，:deep 穿不进子组件内部节点（同 SvgIcon 的坑），
   改在 FormItemWrapper 里用 has-error 直接给根 view 上色（宿主节点有 scope id） */

.form-input_tag {
  position: absolute;
  top: 50%;
  right: 24rpx;
  padding: 4rpx 16rpx;
  font-size: 24rpx;
  color: #999;
  background: #f5f5f5;
  border-radius: 20rpx;
  transform: translateY(-50%);
}
</style>
