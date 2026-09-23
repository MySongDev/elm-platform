import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { deleteAddress, getAddress } from '@/services/api/api-address'

import { useUserStore } from './store-user'

export const useAddressStore = defineStore('address', () => {
  const AddressList = ref([])
  const userStore = useUserStore()

  const loadAddresses = async () => {
    // 未登录时不请求，也不再用兜底 id 冒充身份
    if (!userStore.userId) {
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
    () => userStore.userId,
    async (newUserId) => {
      if (newUserId) {
        await loadAddresses()
        // console.log(newUserId)
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
