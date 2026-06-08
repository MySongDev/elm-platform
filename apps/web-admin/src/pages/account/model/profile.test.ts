import { describe, expect, it } from 'vitest'
import { createProfileUpdatePayload } from './profile'

describe('createProfileUpdatePayload', () => {
  it('trims profile fields and clears blank optional contacts with null', () => {
    expect(createProfileUpdatePayload({
      username: '  admin-new  ',
      email: '   ',
      phone: '',
    })).toEqual({
      username: 'admin-new',
      email: null,
      phone: null,
    })
  })
})
