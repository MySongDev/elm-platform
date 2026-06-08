import type { Ref } from 'vue'
import { ref } from 'vue'

type StateType = '' | 'loading' | 'error' | 'empty' | 'success'

interface UseStateContainerReturn<T> {
  state: Ref<StateType>
  data: Ref<T | null>
  execute: (...args: any[]) => Promise<T | undefined>
  resetState: () => void
}

export function useStateContainer<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
): UseStateContainerReturn<T> {
  const state = ref<StateType>('') as Ref<StateType>
  const data = ref<T | null>(null) as Ref<T | null>

  const execute = async (...args: any[]): Promise<T | undefined> => {
    state.value = 'loading'

    try {
      const res = await asyncFunction(...args)
      data.value = res

      if (!res || (Array.isArray(res) && res.length === 0)) {
        state.value = 'empty'
      }
      else {
        state.value = 'success'
      }
      return res
    }
    catch (err) {
      state.value = 'error'
      throw err
    }
  }

  const resetState = () => {
    state.value = ''
  }

  return {
    state,
    data,
    execute,
    resetState,
  }
}
