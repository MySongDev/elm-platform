import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'

import { getCache, setCache } from '@/untils/db'

interface SWROptions<T> {
  key: string | (() => string)
  fetcher: () => Promise<T>
  expire?: number
  immediate?: boolean
}

interface SWRReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<unknown>
  refresh: () => Promise<void>
}

export function useSWR<T = any>(options: SWROptions<T>): SWRReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<unknown>(null)
  let promise: Promise<void> | null = null

  const expireTime = options.expire ?? 24 * 60 * 60 * 1000

  function resolveKey(): string {
    return typeof options.key === 'function' ? options.key() : options.key
  }

  async function revalidate() {
    if (promise)
      return promise

    loading.value = true

    promise = (async () => {
      try {
        const res = await options.fetcher()
        data.value = res

        await setCache(resolveKey(), {
          data: res,
          timestamp: Date.now(),
        })
      }
      catch (err) {
        error.value = err
      }
      finally {
        loading.value = false
        promise = null
      }
    })()

    return promise
  }

  async function fetchCache() {
    const cache = await getCache(resolveKey())

    if (cache?.data) {
      data.value = cache.data
    }

    const isExpired = !cache || Date.now() - cache.timestamp > expireTime
    if (isExpired)
      revalidate()
  }

  if (options.immediate ?? true)
    onMounted(fetchCache)

  return {
    data,
    loading,
    error,
    refresh: revalidate,
  }
}
