import { ref } from 'vue'

export function useFilter() {
  const filterValues = ref([])

  const toggleFilter = (id) => {
    const index = filterValues.value.indexOf(id)
    if (index > -1) {
      filterValues.value.splice(index, 1)
    }
    else {
      filterValues.value.push(id)
    }
  }

  const clearFilter = () => {
    filterValues.value = []
  }

  const isActive = id => filterValues.value.includes(id)

  return {
    filterValues,
    toggleFilter,
    clearFilter,
    isActive,
  }
}
