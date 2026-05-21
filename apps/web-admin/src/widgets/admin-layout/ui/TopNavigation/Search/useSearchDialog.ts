import type { Ref } from 'vue'
import type { SearchDisplayItem, SearchHistoryItem } from './types'
import type { FlatRoute } from '@/shared/lib/menu'
import { useLocalStorage } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { transformI18n } from '@/shared/i18n'
import { flattenRoutes } from '@/shared/lib/menu'

const HISTORY_KEY = 'elm-admin-search-history'
const MAX_HISTORY = 8

function createNextHistory(history: readonly string[], keyword: string): string[] {
  const value = keyword.trim()
  if (!value)
    return [...history]

  return [
    value,
    ...history.filter(item => item !== value),
  ].slice(0, MAX_HISTORY)
}

function isHistoryItem(item: SearchDisplayItem): item is SearchHistoryItem {
  return 'isHistory' in item && item.isHistory
}

export function useSearchDialog(inputRef: Ref<HTMLInputElement | null>) {
  const router = useRouter()
  const { t } = useI18n()
  const authStore = useAuthStore()
  const visible = shallowRef(false)
  const keyword = shallowRef('')
  const activeIndex = shallowRef(0)
  const searchHistory = useLocalStorage<string[]>(HISTORY_KEY, [])
  const flatRoutes = computed<FlatRoute[]>(() => flattenRoutes(authStore.menuRoutes, transformI18n))

  const searchResults = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw)
      return []

    return flatRoutes.value.filter(route =>
      route.title.toLowerCase().includes(kw) || route.path.toLowerCase().includes(kw),
    )
  })

  const displayList = computed<SearchDisplayItem[]>(() => {
    if (keyword.value.trim())
      return searchResults.value

    return searchHistory.value.map(title => ({
      path: '',
      title,
      isHistory: true as const,
    }))
  })

  const emptyText = computed(() =>
    keyword.value.trim() ? t('header.noResult') : t('header.searchHint'),
  )

  function close() {
    visible.value = false
  }

  function open() {
    visible.value = true
    keyword.value = ''
    activeIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }

  function handleSelect(item?: SearchDisplayItem) {
    if (!item)
      return

    if (isHistoryItem(item)) {
      keyword.value = item.title
      activeIndex.value = 0
      return
    }

    if (!item.path)
      return

    searchHistory.value = createNextHistory(searchHistory.value, item.title)
    router.push(item.path)
    close()
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close()
      return
    }

    const len = displayList.value.length
    if (!len)
      return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % len
        break
      case 'ArrowUp':
        e.preventDefault()
        activeIndex.value = (activeIndex.value - 1 + len) % len
        break
      case 'Enter':
        e.preventDefault()
        handleSelect(displayList.value[activeIndex.value])
        break
    }
  }

  function onGlobalKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      visible.value ? close() : open()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', onGlobalKeydown)
  })

  onUnmounted(() => document.removeEventListener('keydown', onGlobalKeydown))

  watch(keyword, () => { activeIndex.value = 0 })

  return {
    activeIndex,
    displayList,
    emptyText,
    keyword,
    visible,
    close,
    handleSelect,
    onKeydown,
    open,
  }
}
