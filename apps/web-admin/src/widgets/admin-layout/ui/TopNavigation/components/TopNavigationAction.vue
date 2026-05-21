<script setup lang="ts">
defineOptions({ name: 'TopNavigationAction' })

withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  shape?: 'default' | 'circle' | 'pill'
  ariaLabel?: string
}>(), {
  type: 'button',
  shape: 'default',
  ariaLabel: undefined,
})
</script>

<template>
  <button
    class="top-navigation-action"
    :class="`top-navigation-action--${shape}`"
    :type="type"
    :aria-label="ariaLabel"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
.top-navigation-action {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  color: var(--app-text-regular);
  cursor: pointer;
  background: var(--app-bg-page);
  border: 0;
  border-radius: 6px;
  transition:
    color 0.2s,
    background 0.2s;

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    background: var(--app-border-light);
    outline: none;
  }
}

.top-navigation-action--circle {
  justify-content: center;
  width: 32px;
  padding: 0;
  border-radius: 50%;
}

.top-navigation-action--pill {
  padding: 0 8px;
  border-radius: 999px;

  &:hover,
  &:focus-visible {
    color: var(--app-text-regular);
  }
}
</style>
