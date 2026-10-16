// ⚠️ 与 apps/web-user/src/composables/features/address/useAddressDisplay.ts 同源，
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：
// 1. 由 TS 改 JS（uni-user 未配 vue-tsc 覆盖 composables；store 层是 JS 为主）
// 2. `demoAddresses` 在 uni-user 侧未使用（AddressHome 页没有「查看示例地址」入口，
//    web-user 的 404 页也没有；保留同源性故未删，但标注为可裁剪项）

import { computed } from 'vue'

import { maskPhone } from '@/utils/format/format'

export const demoAddresses = [
  {
    id: 'demo-1',
    address: 'xxx宾馆',
    addressDetail: '304',
    name: 'xxx',
    sex: 1,
    phone: '17552025202',
  },
  {
    id: 'demo-2',
    address: 'xxxx医院-病房楼',
    addressDetail: '3002',
    name: 'xxx',
    sex: 1,
    phone: '17552025202',
  },
  {
    id: 'demo-3',
    address: 'xxxx学院-5号楼',
    addressDetail: '209',
    name: 'xxx',
    sex: 1,
    phone: '17552025202',
  },
]

export function getAddressTitle(item = {}) {
  return [item.address, item.addressDetail].filter(Boolean).join(' ')
}

export function getContactName(item = {}) {
  return item.name || item.username || '收货人'
}

export function getContactGender(item = {}) {
  if (item.sex === 2 || item.sex === '2')
    return '女士'
  return '先生'
}

export function getContactPhone(item = {}) {
  return maskPhone(item.phone)
}

export function useAddressDisplay(addressListRef) {
  const displayAddresses = computed(() =>
    addressListRef.value.length ? addressListRef.value : demoAddresses,
  )

  return {
    displayAddresses,
    getAddressTitle,
    getContactName,
    getContactGender,
    getContactPhone,
  }
}
