<script setup>
import { computed, ref, useTemplateRef } from 'vue'

const props = defineProps({
  // modelValue: Number,
  max: { default: 5 },
  readonly: {
    type: Boolean,
    default: true,
  },
  precision: { default: 0.1 },
})
const rating = defineModel()
// const emit = defineEmits(['update:modelValue'])

const container = useTemplateRef('container') // 通过ref拿到整个元素

// const container = ref(null)  //通过ref拿到整个元素
const hoverValue = ref(null)

const currentValue = computed(() =>
  hoverValue.value ?? props.modelValue,
)

const displayPercent = computed(() =>
  `${(currentValue.value / props.max) * 100}%`,
)

function calcScore(clientX) {
  const rect = container.value.getBoundingClientRect()

  let percent = (clientX - rect.left) / rect.width

  percent = Math.min(Math.max(percent, 0), 1)
  let score = percent * props.max

  // 精度控制
  const step = props.precision
  score = Math.round(score / step) * step

  return Number(score.toFixed(2))
}
// 鼠标移动（预览评分）
function onMove(e) {
  if (props.readonly)
    return
  hoverValue.value = calcScore(e.clientX)
}
// 点击确认评分
function onClick(e) {
  if (props.readonly)
    return
  rating.value = calcScore(e.clientX)
  // emit('update:modelValue', calcScore(e.clientX))
}
// 移出恢复
function onLeave() {
  hoverValue.value = null
}
// 移动端支持
function onTouchMove(e) {
  if (props.readonly)
    return
  const touch = e.touches[0]
  hoverValue.value = calcScore(touch.clientX)
}
</script>

<template>
  <div ref="container" class="star" @mousemove="onMove" @click="onClick" @mouseleave="onLeave"
    @touchmove.prevent="onTouchMove" @touchstart.prevent="onTouchMove">
    <!-- 灰色底 -->
    <div class="star-bg">
      <SvgIcon v-for="num in max" :key="num" icon-name="star" />
    </div>
    <!-- 高亮层 -->
    <div class="star-active">
      <SvgIcon v-for="num in max" :key="num" icon-name="star" />
    </div>
  </div>
  <span class="rating">{{ rating }}</span>
</template>

<style lang="scss" scoped>
.star {
  position: relative;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.star-bg {
  color: #ddd;

  // fill: #ddd;
}

.star-active {
  // fill: #f7ba2a;
  position: absolute;
  top: 0;
  left: 0;
  width: v-bind(displaypercent);
  overflow: hidden;
  color: #f7ba2a;
  white-space: nowrap;
  pointer-events: none;
  transition: width 0.35s ease;
}

.rating {
  display: inline-block;
  margin-left: 4px;
  font-size: 14px;
  color: #f7ba2a;
  transform: translateY(-1.5px);
}
</style>
