<script setup>
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
})

const emit = defineEmits(['update:modelValue', 'field-change', 'field-blur'])

function onInput(e) {
  const value = e.target.value
  emit('update:modelValue', value)
  emit('field-change', value)
}

function onBlur(e) {
  emit('field-blur', e.target.value)
}
</script>

<template>
  <FormItemWrapper :label="label" :error="error">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :name="name"
      :data-field="name"
      v-bind="$attrs"
      class="form-input"
      @input="onInput"
      @blur="onBlur"
    >
    <span v-if="optional" class="form-input_tag">选填</span>
  </FormItemWrapper>
</template>

<style lang="scss" scoped>
.form-input {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font-size: 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s;

  &:focus {
    border-color: #1890ff;
    outline: none;
    box-shadow: 0 0 0 2px rgb(24 144 255 / 10%);
  }
}

:deep(.has-error) .form-input {
  border-color: #ff4d4f;

  &:focus {
    box-shadow: 0 0 0 2px rgb(255 77 79 / 10%);
  }
}

.form-input_tag {
  position: absolute;
  top: 50%;
  right: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  border-radius: 10px;
  transform: translateY(-50%);
}
</style>
