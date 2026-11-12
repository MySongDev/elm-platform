import { maskPhone } from '@/utils/format/format'

export function getAddressTitle(item = {}) {
  return [item.address, item.addressDetail].filter(Boolean).join(' ')
}
export function getContactName(item = {}) {
  return item.name || item.username || '收货人'
}
export function getContactGender(item = {}) {
  return item.sex === 2 || item.sex === '2' ? '女士' : '先生'
}
export function getContactPhone(item = {}) {
  return maskPhone(item.phone)
}

/** 空列表就是没有地址，不能用示例冒充；否则示例也会出现真实编辑/删除按钮。 */
export function useAddressDisplay(addressListRef) {
  return {
    displayAddresses: addressListRef,
    getAddressTitle,
    getContactName,
    getContactGender,
    getContactPhone,
  }
}
