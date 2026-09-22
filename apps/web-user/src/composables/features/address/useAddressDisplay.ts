import type { Ref } from 'vue'
import { computed } from 'vue'

import { maskPhone } from '@/utils/format/format'

interface AddressItem {
  id?: string | number
  address?: string
  addressDetail?: string
  name?: string
  username?: string
  sex?: number | string
  phone?: string
}

export const demoAddresses: AddressItem[] = [
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

export function getAddressTitle(item: AddressItem = {}): string {
  return [item.address, item.addressDetail].filter(Boolean).join(' ')
}

export function getContactName(item: AddressItem = {}): string {
  return item.name || item.username || '收货人'
}

export function getContactGender(item: AddressItem = {}): string {
  if (item.sex === 2 || item.sex === '2')
    return '女士'
  return '先生'
}

export function getContactPhone(item: AddressItem = {}): string {
  return maskPhone(item.phone)
}

export function useAddressDisplay(addressListRef: Ref<AddressItem[]>) {
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
