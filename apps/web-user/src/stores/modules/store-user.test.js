import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useUserStore } from './store-user'

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('normalizes backend numeric user ids to strings', () => {
    const store = useUserStore()

    store.recordUserInfo({
      user_id: 80251,
      username: 'song',
      avatar: 'default.jpg',
    })

    expect(store.userId).toBe('80251')
    expect(store.userInfo.user_id).toBe('80251')
    expect(localStorage.getItem('user_id')).toBe('80251')
  })
})
