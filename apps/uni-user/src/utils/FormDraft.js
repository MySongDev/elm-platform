// ⚠️ 与 apps/web-user/src/utils/FormDraft.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异（方案 ⑥ 节）：web-user 在 :9,13,17 直接用 localStorage，
// 小程序端会直接 ReferenceError。改走 platform/storage 封装。
// 草稿语义（deep watch 自动存 / 过期清理 / onMounted 恢复）逐行一致。

import { onMounted, watch } from 'vue'

import { getStore, removeStore, setStore } from '@/platform/storage'

export function useFormDraft(form, storageKey = 'form_draft', expireMinutes = 30) {
  function saveDraft() {
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
    const saved = getStore(storageKey)
    if (!saved)
      return

    try {
      const { value, expire } = saved
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
