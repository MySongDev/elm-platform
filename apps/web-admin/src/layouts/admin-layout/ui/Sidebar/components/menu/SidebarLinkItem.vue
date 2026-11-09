<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'

defineOptions({ name: 'SidebarLinkItem' })

const props = defineProps<{
  to: RouteRecordRaw | string
}>()

const HTTP_URL_RE = /^https?:\/\//i

const isExternalLink = computed(() => {
  if (typeof props.to === 'string')
    return HTTP_URL_RE.test(props.to)

  return HTTP_URL_RE.test(props.to.path) || (typeof props.to.name === 'string' && HTTP_URL_RE.test(props.to.name))
})

const linkProps = computed(() => {
  if (typeof props.to === 'string') {
    return isExternalLink.value
      ? {
          href: props.to,
          target: '_blank',
          rel: 'noopener',
        }
      : { to: props.to }
  }

  if (isExternalLink.value) {
    const href = typeof props.to.name === 'string' && HTTP_URL_RE.test(props.to.name)
      ? props.to.name
      : props.to.path
    return {
      href,
      target: '_blank',
      rel: 'noopener',
    }
  }

  return { to: props.to.path }
})
</script>

<template>
  <component :is="isExternalLink ? 'a' : 'router-link'" class="sidebar-link" v-bind="linkProps">
    <slot />
  </component>
</template>

<style scoped lang="scss">
.sidebar-link {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  color: inherit;
  text-decoration: none;
}
</style>
