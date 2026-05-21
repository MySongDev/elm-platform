<script setup lang="ts">
defineOptions({ name: 'SvgIcon' })

const props = defineProps<Props>()

interface Props {
  iconName: string
  iconClass?: string
  color?: string
}

const svgClass = computed(() => {
  return props.iconClass ? `svg-icon ${props.iconClass}` : 'svg-icon'
})
</script>

<template>
  <svg :class="svgClass" aria-hidden="true">
    <use :href="`#icon-${iconName}`" />
  </svg>
</template>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  overflow: hidden;
  vertical-align: -0.15em;
  fill: currentcolor;
}
</style>
