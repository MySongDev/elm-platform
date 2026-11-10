import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { addAddress, deleteAddress, getAddress, setDefaultAddress as setDefaultApi, updateAddress } from '@/services/api/api-address'
import { useUserStore } from './store-user'

export const useAddressStore = defineStore('address', () => {
  const AddressList = ref([])
  const userStore = useUserStore()
  // 保存/删除后，较早发出的列表请求不能把旧地址盖回来。
  let readVersion = 0
  const currentUser = () => String(userStore.userId)
  const belongsToCurrentUser = owner => userStore.isLogin && currentUser() === owner

  async function loadAddresses() {
    const version = ++readVersion
    const owner = currentUser()
    if (!userStore.isLogin) {
      AddressList.value = []
      return false
    }
    try {
      const result = await getAddress()
      if (version !== readVersion || !belongsToCurrentUser(owner))
        return false
      AddressList.value = Array.isArray(result?.data) ? result.data : []
      return true
    }
    catch (error) {
      console.error('地址加载失败', error)
      return false
    }
  }

  function commitAddress(address) {
    ++readVersion
    if (address.isDefault) {
      AddressList.value = AddressList.value.map(row => ({
        ...row,
        isDefault: false,
      }))
    }
    const index = AddressList.value.findIndex(row => row.id === address.id)
    if (index === -1)
      AddressList.value.unshift(address)
    else
      AddressList.value.splice(index, 1, address)
  }

  /** 用保存结果更新列表，返回上一页前就能看到已写入的数据，不依赖刷新碰巧完成。 */
  async function saveAddress(id, params) {
    const owner = currentUser()
    ++readVersion
    const result = await (id === null ? addAddress(params) : updateAddress(id, params))
    if (belongsToCurrentUser(owner))
      commitAddress(result.data)
    return result.data
  }

  async function markDefault(id) {
    const owner = currentUser()
    ++readVersion
    await setDefaultApi(id)
    if (!belongsToCurrentUser(owner))
      return
    ++readVersion
    AddressList.value = AddressList.value.map(row => ({
      ...row,
      isDefault: row.id === id,
    }))
  }

  async function romeAddress(id) {
    const index = AddressList.value.findIndex(row => row.id === id)
    if (index === -1)
      return false
    const owner = currentUser()
    ++readVersion
    const deleted = AddressList.value.splice(index, 1)[0]
    try {
      await deleteAddress(id)
      if (belongsToCurrentUser(owner)) {
        ++readVersion
        AddressList.value = AddressList.value.filter(row => row.id !== id)
      }
      return true
    }
    catch (error) {
      // 请求失败才放回原位置；换账号后不能把旧账号地址塞进新列表。
      if (belongsToCurrentUser(owner)) {
        ++readVersion
        if (!AddressList.value.some(row => row.id === id))
          AddressList.value.splice(Math.min(index, AddressList.value.length), 0, deleted)
      }
      console.error('删除失败', error)
      return false
    }
  }

  watch(() => [userStore.isLogin, userStore.userId], ([loggedIn]) => {
    ++readVersion
    AddressList.value = []
    if (loggedIn)
      void loadAddresses()
  }, { immediate: true })

  return {
    AddressList,
    loadAddresses,
    saveAddress,
    markDefault,
    romeAddress,
  }
})
