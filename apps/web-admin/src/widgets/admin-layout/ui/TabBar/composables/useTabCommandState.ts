import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useTabsStore } from '@/entities/tab'
import { createTabCommandState } from '../model/createTabCommandState'

export { createTabCommandState } from '../model/createTabCommandState'

export function useTabCommandState(
  targetFullPath: MaybeRefOrGetter<string | null | undefined>,
) {
  const tabsStore = useTabsStore()

  return computed(() =>
    createTabCommandState(tabsStore.tabs, toValue(targetFullPath)),
  )
}
