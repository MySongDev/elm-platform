import { describe, expect, it } from 'vitest'

import { getAddressTitle, getContactGender, getContactName, getContactPhone } from './useAddressDisplay'

describe('address display helpers', () => {
  it('combines community and detail as address title', () => {
    expect(getAddressTitle({ address: 'xxx宾馆', address_detail: '304' })).toBe('xxx宾馆 304')
  })

  it('normalizes contact name, gender and phone', () => {
    const address = { name: 'xxx', sex: 1, phone: '17552025202' }

    expect(getContactName(address)).toBe('xxx')
    expect(getContactGender(address)).toBe('先生')
    expect(getContactPhone(address)).toBe('175****5202')
  })

  it('supports female gender marker', () => {
    expect(getContactGender({ sex: '2' })).toBe('女士')
  })
})
