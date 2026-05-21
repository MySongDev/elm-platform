import { ref } from 'vue'

export function useTabSwitch(options) {
  const { tabs, initialTab = tabs[0], scrollRef } = options

  const activeTab = ref(initialTab)
  const scrollPositions = new Map()

  function switchTab(tab) {
    if (!tabs.includes(tab) || activeTab.value === tab)
      return

    if (scrollRef.value)
      scrollPositions.set(activeTab.value, scrollRef.value.scrollTop)

    activeTab.value = tab

    requestAnimationFrame(() => {
      if (scrollRef.value)
        scrollRef.value.scrollTop = scrollPositions.get(tab) ?? 0
    })
  }

  return {
    activeTab,
    switchTab,
  }
}
