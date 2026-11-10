/** 小程序本地草稿；编辑可关闭保存/恢复，避免覆盖服务器详情。 */

import { onMounted, watch } from 'vue'

import { getStore, removeStore, setStore } from '@/platform/storage'

export function useFormDraft(form, storageKey = 'form_draft', expireMinutes = 30, enabled = () => true) {
  function saveDraft() {
    if (!enabled())
      return
    const data = {
      value: form,
      expire: Date.now() + expireMinutes * 60 * 1000,
    }
    setStore(storageKey, data)
  }

  function clearDraft() {
    removeStore(storageKey)
  }

  function restoreDraft() {
    // 编辑页用服务器详情，不能被新增草稿覆盖。
    if (!enabled())
      return false
    const saved = getStore(storageKey)
    if (!saved)
      return

    try {
      const { value, expire } = saved
      if (Date.now() < expire) {
        Object.assign(form, value)
        return true
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
