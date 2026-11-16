import { isRef, ref } from 'vue'

export function useTabSwitch(options) {
  const { tabs, initialTab = tabs[0], scrollRef } = options

  // 传错容器不会当场报错，而是切回页签时位置悄悄回到顶部，所以在这里一次性拦住。
  if (!isRef(scrollRef))
    throw new TypeError('useTabSwitch: scrollRef 必须是模板 ref，即模板里 ref="xxx" 绑定的那个')

  const activeTab = ref(initialTab)
  const scrollPositions = new Map()

  function switchTab(tab) {
    if (!tabs.includes(tab) || activeTab.value === tab)
      return

    scrollPositions.set(activeTab.value, scrollRef.value.scrollTop)

    activeTab.value = tab

    requestAnimationFrame(() => {
      // 这一帧到来前页面可能已卸载，Vue 卸载时会把 ref 置回 null，所以这里要判空。
      if (scrollRef.value)
        scrollRef.value.scrollTop = scrollPositions.get(tab) ?? 0
    })
  }

  return {
    activeTab,
    switchTab,
  }
}
