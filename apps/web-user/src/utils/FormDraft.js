import { onMounted, watch } from 'vue'

export function useFormDraft(form, storageKey = 'form_draft', expireMinutes = 30) {
  function saveDraft() {
    const data = {
      value: form,
      expire: Date.now() + expireMinutes * 60 * 1000,
    }
    localStorage.setItem(storageKey, JSON.stringify(data))
  }

  function clearDraft() {
    localStorage.removeItem(storageKey)
  }

  function restoreDraft() {
    const saved = localStorage.getItem(storageKey)
    if (!saved)
      return

    try {
      const { value, expire } = JSON.parse(saved)
      if (Date.now() < expire) {
        Object.assign(form, value)
      }
      else {
        clearDraft()
      }
    }
    catch {
      clearDraft()
    }
  }

  watch(form, saveDraft, { deep: true })

  onMounted(restoreDraft)

  return {
    saveDraft,
    clearDraft,
    restoreDraft,
  }
}
