<script setup>
import { computed } from 'vue'

const props = defineProps({
  specGroup: {
    type: Object,
    required: true,
  },
  selectedValue: {
    type: String,
    default: '',
  },
  uiConfig: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select'])

/**
 * 选项布局样式类
 */
const optionsLayoutClass = computed(() => {
  const columns = props.uiConfig.columns || 1
  return {
    'layout-single': columns === 1,
    'layout-double': columns === 2,
    'layout-triple': columns === 3,
  }
})

/**
 * 选项样式（主题色）
 */
const optionStyle = computed(() => ({
  '--theme-color': props.uiConfig.themeColor || '#FF6B6B',
  '--theme-light': props.uiConfig.themeColor
    ? `${props.uiConfig.themeColor}20`
    : '#FFF0F0',
}))

/**
 * 选项是否禁用
 */
function isOptionDisabled(_option) {
  // 可扩展：库存不足等情况
  return false
}

/**
 * 处理选择
 */
function handleSelect(option) {
  if (isOptionDisabled(option))
    return
  emit('select', props.specGroup.id, option.id)
}
</script>

<template>
  <div class="specs-group">
    <!-- 规格组标题 -->
    <div class="specs-group-header">
      <span class="specs-name">{{ specGroup.name }}</span>
      <span v-if="specGroup.required" class="required-tag">必选</span>
    </div>

    <!-- 规格选项列表 -->
    <div class="specs-options" :class="optionsLayoutClass">
      <div v-for="option in specGroup.options" :key="option.id" class="specs-option" :class="{
        'is-selected': option.id === selectedValue,
        'is-disabled': isOptionDisabled(option),
      }" :style="optionStyle" @click="handleSelect(option)">
        <span class="option-name">{{ option.name }}</span>
        <span v-if="option.price > 0" class="option-price">
          +¥{{ option.price }}
        </span>

        <!-- 选中标记 -->
        <span v-if="option.id === selectedValue" class="check-icon">
          ✓
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.specs-group {
  margin-bottom: 20px;
}

.specs-group-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.specs-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.required-tag {
  padding: 2px 6px;
  margin-left: 8px;
  font-size: 11px;
  color: #FF4D4F;
  background: #FFF0F0;
  border-radius: 4px;
}

.specs-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.layout-single .specs-option {
  width: 100%;
}

.layout-double .specs-option {
  width: calc(50% - 5px);
}

.layout-triple .specs-option {
  width: calc(33.33% - 7px);
}

.specs-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: #F7F8FA;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.specs-option.is-selected {
  color: var(--theme-color);
  background: var(--theme-light);
  border-color: var(--theme-color);
}

.specs-option.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.specs-option:not(.is-disabled):hover {
  border-color: var(--theme-color);
}

.option-name {
  font-size: 14px;
}

.option-price {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.check-icon {
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-size: 10px;
  color: var(--theme-color);
}
</style>
