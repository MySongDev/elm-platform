// ⚠️ 与 apps/web-user/src/stores/modules/store-address.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：零逻辑差异（依赖的 api-address.js 平台差异已收口在 api 层）。
// loadAddresses 的调用时机由页面 onShow 承担（tabBar 页二次进入不触发 onMounted）。

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { deleteAddress, getAddress } from '@/services/api/api-address'

import { useUserStore } from './store-user'

export const useAddressStore = defineStore('address', () => {
  const AddressList = ref([])
  const userStore = useUserStore()

  const loadAddresses = async () => {
    // 未登录时不请求；身份由请求头令牌决定，前端不再持有 userId
    if (!userStore.isLogin) {
      AddressList.value = []
      return
    }

    try {
      const res = await getAddress()
      AddressList.value = Array.isArray(res?.data) ? res.data : []
    }
    catch (error) {
      console.error(error)
    }
  }
  watch(
    () => userStore.isLogin,
    async (loggedIn) => {
      if (loggedIn) {
        await loadAddresses()
      }
      else {
        AddressList.value = []
      }
    },
    { immediate: true },
  )
  // 乐观删除地址
  const romeAddress = async (addressId) => {
    const idx = AddressList.value.findIndex(a => a.id === addressId)
    if (idx === -1)
      return

    // 先从列表中删除
    const deleted = AddressList.value.splice(idx, 1)[0]

    try {
      await deleteAddress(addressId)
      // 删除成功，不用做额外操作
    }
    catch (err) {
      console.error('删除失败', err)
      // 回滚
      AddressList.value.splice(idx, 0, deleted)
    }
  }
  return {
    AddressList,
    loadAddresses,
    romeAddress,
  }
})
