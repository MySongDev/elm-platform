<script setup>
import { computed } from 'vue'

const props = defineProps({
  iconName: {
    type: String,
    required: true,
  },
  iconClass: {
    type: String,
    default: '',
  },
  color: String,
  multicolor: {
    type: Boolean,
    default: false,
  },
})

const useIconName = computed(() => `#icon-${props.iconName}`)

const svgClass = computed(() => {
  const base = 'svg-icon'
  const cls = props.iconClass ? `${base} ${props.iconClass}` : base
  return props.multicolor ? `${cls} svg-icon--multicolor` : cls
})

const svgStyle = computed(() => {
  if (props.multicolor)
    return undefined
  return props.color ? { '--icon-fill': props.color } : undefined
})
</script>

<template>
  <svg :class="svgClass" aria-hidden="true" :style="svgStyle">
    <use :href="useIconName" />
  </svg>
</template>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  overflow: hidden;

  /* 单色模式：默认继承 color，可被 CSS 变量覆盖 */
  fill: var(--icon-fill, currentColor);
}

/* 多色模式：强制移除 fill 控制，让 SVG 内部 path 的 fill 生效 */
.svg-icon--multicolor {
  fill: none;
}
</style>
