import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLocationStore } from './store-locations'

describe('useLocationStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('stores location coordinates and normalized address fields', () => {
    const store = useLocationStore()

    store.setLocation(32.35, 113.54, {
      geohash: 'wtb8p9wjv5x6',
      city: '南阳市',
      cityId: 1667,
      address: '河南省南阳市桐柏县',
      name: '月河镇',
      districtId: 1667,
    })

    expect(store.latitude).toBe(32.35)
    expect(store.longitude).toBe(113.54)
    expect(store.geohash).toBe('wtb8p9wjv5x6')
    expect(store.city).toBe('南阳市')
    expect(store.name).toBe('月河镇')
  })
})
