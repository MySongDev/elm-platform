import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStore, removeStore, setStore } from '@/platform/storage'

const PROBE_KEY = 'uni_user_batch0_probe'

/**
 * Batch 0 第 2 项验证用：确认 pinia 2.x 在 uni-app 下可用。
 * 覆盖 defineStore 的 setup 式写法 + storeToRefs 所需的 ref 状态（web-user 用的是这种）。
 */
export const useBatch0Store = defineStore('batch0', () => {
  const cached = getStore<{ count: number }>(PROBE_KEY)
  const count = ref(typeof cached === 'object' && cached ? cached.count : 0)
  const label = ref('pinia-probe')

  function increment() {
    count.value += 1
    setStore(PROBE_KEY, { count: count.value })
  }

  function reset() {
    count.value = 0
    removeStore(PROBE_KEY)
  }

  return {
    count,
    label,
    increment,
    reset,
  }
})
