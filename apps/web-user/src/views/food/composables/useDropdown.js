import { shallowRef } from 'vue'

export function useDropdown() {
  const activeTab = shallowRef('')
  const showDropdown = shallowRef(false)

  const closeDropdown = () => {
    showDropdown.value = false
  }

  const openDropdown = (tabName) => {
    activeTab.value = tabName
    showDropdown.value = true
  }
  const toggleDropdown = (tabName) => {
    if (activeTab.value === tabName && showDropdown.value) {
      showDropdown.value = false
    }
    else {
      openDropdown(tabName)
    }
  }

  return {
    activeTab,
    showDropdown,
    toggleDropdown,
    closeDropdown,
    openDropdown,
  }
}
