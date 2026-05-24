import type { MenuInstance } from 'element-plus'
import type { Ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { filterRoutesByAccess } from '@/shared/lib/permission'

function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/')
}

function getVisibleChildren(routeItem: RouteRecordRaw): RouteRecordRaw[] {
  return routeItem.children?.filter(child => !child.meta?.hidden) ?? []
}

function isRenderedAsSubMenu(routeItem: RouteRecordRaw): boolean {
  const visibleChildren = getVisibleChildren(routeItem)
  return visibleChildren.length > 1 || !!routeItem.meta?.alwaysShow
}

export function resolveSidebarOpenKeys(path: string, routes: RouteRecordRaw[], basePath = ''): string[] | null {
  for (const routeItem of routes) {
    const fullPath = routeItem.path.startsWith('/')
      ? routeItem.path
      : normalizePath(`${basePath}/${routeItem.path}`)

    if (fullPath === path)
      return []

    const visibleChildren = getVisibleChildren(routeItem)
    if (visibleChildren.length) {
      const childResult = resolveSidebarOpenKeys(path, visibleChildren, fullPath)
      if (childResult !== null)
        return isRenderedAsSubMenu(routeItem) ? [fullPath, ...childResult] : childResult
    }
  }

  return null
}

export function useSidebarMenu(menuRef: Ref<MenuInstance | null | undefined>) {
  const route = useRoute()
  const authStore = useAuthStore()
  const currentOpenKeys = ref<string[]>([])

  const filteredRoutes = computed(() => {
    const userRole = authStore.userInfo?.role
    return filterRoutesByAccess(authStore.menuRoutes, userRole, authStore.permissions)
      .slice()
      .sort((a, b) => (a.meta?.order ?? 99) - (b.meta?.order ?? 99))
  })

  const activeMenu = computed(() => {
    return (route.meta.activePath as string | undefined) || route.path
  })

  function syncOpenKeys(targetKeys: string[]) {
    const menu = menuRef.value
    if (!menu)
      return

    const targetSet = new Set(targetKeys)
    const currentSet = new Set(currentOpenKeys.value)

    for (const key of currentOpenKeys.value) {
      if (!targetSet.has(key))
        menu.close(key)
    }

    for (const key of targetKeys) {
      if (!currentSet.has(key))
        menu.open(key)
    }

    currentOpenKeys.value = [...targetKeys]
  }

  function handleOpen(index: string) {
    if (!currentOpenKeys.value.includes(index))
      currentOpenKeys.value.push(index)
  }

  function handleClose(index: string) {
    currentOpenKeys.value = currentOpenKeys.value.filter(key => key !== index)
  }

  watch(
    () => [route.path, filteredRoutes.value] as const,
    ([newPath]) => {
      const targetKeys = resolveSidebarOpenKeys(newPath, filteredRoutes.value) ?? []
      nextTick(() => syncOpenKeys(targetKeys))
    },
    { immediate: true },
  )

  return {
    activeMenu,
    filteredRoutes,
    handleClose,
    handleOpen,
  }
}
