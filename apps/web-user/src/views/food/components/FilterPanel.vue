<script setup>
import { computed } from 'vue'

const props = defineProps({
  attributes: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  deliveryTags: {
    type: Array,
    default: () => [],
  },
  deliveryValue: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits([
  'update:modelValue',
  'update:deliveryValue',
  'clear',
  'confirm',
])

function toggleAttr(id) {
  const arr = [...props.modelValue]
  const idx = arr.indexOf(id)
  idx > -1 ? arr.splice(idx, 1) : arr.push(id)
  emit('update:modelValue', arr)
}

const selectedDelivery = computed({
  get: () => props.deliveryValue,
  set: val => emit('update:deliveryValue', val),
})

function toggleDelivery(id) {
  const arr = [...selectedDelivery.value]
  const idx = arr.indexOf(id)
  idx > -1 ? arr.splice(idx, 1) : arr.push(id)
  selectedDelivery.value = arr
}

function getTagStyle(attr) {
  const color = attr?.icon_color?.replace(/^#/, '') || '999999'
  const isValid = /^[0-9A-F]{6}$|^[0-9A-F]{3}$/i.test(color)
  const safeColor = isValid ? color : '999999'

  return {
    color: `#${safeColor}`,
    border: `1px solid #${safeColor}`,
  }
}

function handleClear() {
  emit('update:modelValue', [])
  emit('update:deliveryValue', [])
  emit('clear')
}
</script>

<template>
  <div class="filter-panel">
    <div class="section">
      <div class="section-title">
        配送方式
      </div>
      <div class="tag-row">
        <div
          v-for="tag in deliveryTags" :key="tag.id" class="filter-tag"
          :class="{ active: selectedDelivery.includes(tag.id) }" @click="toggleDelivery(tag.id)"
        >
          <SvgIcon icon-name="fengniao" icon-class="tag-icon" />
          <span>{{ tag.text }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        商家属性（可以多选）
      </div>
      <div class="tag-grid">
        <div
          v-for="attr in attributes" :key="attr.id" class="filter-tag"
          :class="{ active: modelValue.includes(attr.id) }" @click="toggleAttr(attr.id)"
        >
          <span class="tag-icon" :style="getTagStyle(attr)">
            {{ attr.icon_name }}
          </span>
          <span>{{ attr.name }}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <button class="btn-clear" @click="handleClear">
        清空
      </button>
      <button class="btn-confirm" @click="emit('confirm')">
        确定
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-panel {
  position: relative;
  max-height: 60vh;
  padding: 20px 15px;
  overflow-y: auto;
  background: #fff;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.filter-tag {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  user-select: none;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.filter-tag.active {
  color: #2395ff;
  background: #f0f7ff;
  border-color: #2395ff;
}

.tag-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 11px;
  font-weight: bold;
  border-radius: 3px;
}

.footer {
  position: sticky;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 12px;
  padding: 15px;
  margin: 0 -15px -20px;
  background: #fff;
  border-top: 1px solid #eee;

  /* 抵消父容器 padding */
}

.btn-clear,
.btn-confirm {
  flex: 1;
  height: 40px;
  font-size: 15px;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  transition: opacity 0.2s;
}

.btn-clear {
  color: #333;
  background: #fff;
  border: 1px solid #ddd;
}

.btn-clear:active {
  background: #f5f5f5;
}

.btn-confirm {
  color: #fff;
  background: #4cd964;
}

.btn-confirm:active {
  opacity: 0.9;
}
</style>
