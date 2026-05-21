<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { transformI18n } from '@/shared/i18n'
import { filterRoutesByAccess } from '@/shared/lib/permission'
import SidebarLinkItem from './SidebarLinkItem.vue'

defineOptions({ name: 'SidebarItem' })

const props = withDefaults(defineProps<{
  route: RouteRecordRaw
  basePath?: string
  isNest?: boolean
  collapse?: boolean
}>(), {
  basePath: '',
  isNest: false,
  collapse: false,
})

const authStore = useAuthStore()
const HTTP_URL_RE = /^https?:\/\//i

function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/')
}

function resolvePath(routePath: string): string {
  if (HTTP_URL_RE.test(routePath) || HTTP_URL_RE.test(props.basePath))
    return routePath || props.basePath

  if (routePath.startsWith('/'))
    return normalizePath(routePath)

  return normalizePath(`${props.basePath}/${routePath}`)
}

function getTitle(meta?: RouteRecordRaw['meta']): string {
  if (!meta)
    return ''

  return transformI18n(meta.title)
}

const visibleChildren = computed(() => {
  const userRole = authStore.userInfo?.role
  const children = props.route.children ?? []
  return filterRoutesByAccess(children, userRole, authStore.permissions)
    .filter(child => !child.meta?.hidden)
})

const onlyChild = computed(() => visibleChildren.value[0])

const hasOneShowingChild = computed(() => {
  if (props.route.meta?.alwaysShow)
    return false

  return visibleChildren.value.length === 1
})

const fullPath = computed(() => resolvePath(props.route.path))

const leafRoute = computed(() => {
  if (hasOneShowingChild.value && onlyChild.value)
    return onlyChild.value

  return props.route
})

const leafPath = computed(() => {
  if (hasOneShowingChild.value && onlyChild.value) {
    if (HTTP_URL_RE.test(onlyChild.value.path))
      return onlyChild.value.path

    if (HTTP_URL_RE.test(fullPath.value))
      return fullPath.value

    return normalizePath(`${fullPath.value}/${onlyChild.value.path}`)
  }

  return fullPath.value
})

const leafLinkTarget = computed<RouteRecordRaw | string>(() => {
  if (typeof leafRoute.value.name === 'string' && HTTP_URL_RE.test(leafRoute.value.name)) {
    return {
      ...leafRoute.value,
      path: leafPath.value,
    }
  }

  return leafPath.value
})

const leafIcon = computed(() => {
  return (leafRoute.value.meta?.icon || props.route.meta?.icon) as string | undefined
})

const leafTitle = computed(() => {
  return getTitle(leafRoute.value.meta) || getTitle(props.route.meta)
})
</script>

<template>
  <template v-if="!route.meta?.hidden">
    <SidebarLinkItem
      v-if="visibleChildren.length === 0 || hasOneShowingChild"
      :to="leafLinkTarget"
    >
      <el-menu-item
        :index="leafPath"
        :class="[
          { 'outer-most': !isNest },
          { 'submenu-title-noDropdown': !isNest },
          { 'nest-menu': isNest },
        ]"
      >
        <div v-if="leafIcon" class="menu-icon" :class="{ 'is-collapse': props.collapse }">
          <SvgIcon :icon-name="leafIcon" />
        </div>
        <template #title>
          <span class="menu-title" :class="{ 'is-collapse': props.collapse }">{{ leafTitle }}</span>
        </template>
      </el-menu-item>
    </SidebarLinkItem>

    <el-sub-menu v-else :index="fullPath" :class="[{ 'outer-most': !isNest }, { 'nest-menu': isNest }]">
      <template #title>
        <div v-if="route.meta?.icon" class="menu-icon" :class="{ 'is-collapse': props.collapse }">
          <SvgIcon :icon-name="route.meta.icon" />
        </div>
        <span class="menu-title" :class="{ 'is-collapse': props.collapse }">{{ getTitle(route.meta) }}</span>
      </template>
      <SidebarItem
        v-for="child in visibleChildren"
        :key="child.path"
        :route="child"
        :base-path="fullPath"
        :is-nest="true"
      />
    </el-sub-menu>
  </template>
</template>

<style scoped lang="scss">
.menu-icon {
  flex-shrink: 0;
  font-size: 18px;

  &.is-collapse {
    margin: 0;
  }
}

.menu-title {
  margin-left: 10px;
  opacity: 1;
  transition: opacity 0.15s ease;
  transition-delay: 0.15s;

  &.is-collapse {
    width: 0;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    opacity: 0;
    transition-delay: 0s;
  }
}
</style>
