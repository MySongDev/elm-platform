import { ref } from 'vue'

export function useSubmitGuard() {
  const submitting = ref(false)

  async function guardedSubmit<T>(submitter: () => Promise<T> | T) {
    if (submitting.value)
      return undefined

    submitting.value = true

    try {
      return await submitter()
    }
    finally {
      submitting.value = false
    }
  }

  return {
    submitting,
    guardedSubmit,
  }
}
