<script setup>
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
    <div class="sex-group">
      <label
        v-for="opt in options" :key="opt.value" class="sex-option"
        :class="{ active: modelValue === opt.value }"
      >
        <input
          type="radio" :value="opt.value" name="sex" data-field="sex"
          :checked="modelValue === opt.value"
          class="sex-option_input" @change="onChange(opt.value)"
        >
        <span class="sex-option_content">
          <span class="sex-option_icon">{{ opt.icon }}</span>
          <span class="sex-option_text">{{ opt.label }}</span>
          <span v-if="modelValue === opt.value" class="sex-option_check">✓</span>
        </span>
      </label>
    </div>
  </FormItemWrapper>
</template>

<style lang="scss" scoped>
.sex-group {
  display: flex;
  gap: 16px;
}

.sex-option {
  flex: 1;
  cursor: pointer;
  user-select: none;

  &_input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }

  &_content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-height: 55px;
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 16px;
    transition: all 0.3s;
  }

  &.active &_content {
    background: #e6f7ff;
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgb(24 144 255 / 15%);
  }

  &_icon {
    font-size: 25px;
    transition: transform 0.3s;
  }

  &.active &_icon {
    transform: scale(1.1);
  }

  &_text {
    font-size: 16px;
    font-weight: 500;
    color: #495057;
  }

  &.active &_text {
    font-weight: 600;
    color: #1890ff;
  }

  &_check {
    position: absolute;
    top: 2px;
    right: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    background: #1890ff;
    border-radius: 50%;
    animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  &:active &_content {
    transform: scale(0.98);
  }
}

@keyframes popIn {
  0% { transform: scale(0); }
  80% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
