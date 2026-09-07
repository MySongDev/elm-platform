import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLocationStore } from './store-locations'

describe('useLocationStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.stubGlobal('navigator', { ...navigator })
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

  it('falls back to empty fields when nothing is provided', () => {
    const store = useLocationStore()
    store.setLocation(1, 2, {})

    expect(store.latitude).toBe(1)
    expect(store.longitude).toBe(2)
    expect(store.geohash).toBeNull()
    expect(store.city).toBe('')
    expect(store.address).toBe('')
    expect(store.name).toBe('')
  })

  it('canEnterMsite tracks coordinate availability regardless of source', () => {
    const store = useLocationStore()
    expect(store.canEnterMsite).toBe(false)

    // 手动选城（不依赖浏览器定位成功）也应算可进入
    store.setLocation(32.35, 113.54, { name: '月河镇' })
    expect(store.canEnterMsite).toBe(true)
  })

  it('loadCurrentLocation resolves geohash and city from reverse geocoding', async () => {
    const mockPosition = {
      coords: {
        latitude: 32.35,
        longitude: 113.54,
      },
    }
    const geolocation = {
      getCurrentPosition: vi.fn().mockImplementation(success => success(mockPosition)),
    }
    vi.stubGlobal('navigator', { geolocation })

    const reverseModule = await import('@/services/api/api-city')
    vi.spyOn(reverseModule, 'getReverseGeoCoding').mockResolvedValue({
      latitude: 32.35,
      longitude: 113.54,
      name: '月河镇',
      address: '河南省南阳市桐柏县',
      city: '南阳市',
      city_id: 1667,
      geohash: 'wtb8p9wjv5x6',
      district_id: 1667,
    })

    const store = useLocationStore()
    await store.loadCurrentLocation()

    expect(reverseModule.getReverseGeoCoding).toHaveBeenCalledWith(32.35, 113.54)
    expect(store.latitude).toBe(32.35)
    expect(store.longitude).toBe(113.54)
    expect(store.geohash).toBe('wtb8p9wjv5x6')
    expect(store.city).toBe('南阳市')
    expect(store.name).toBe('月河镇')
    expect(store.status).toBe('success')
    expect(store.canEnterMsite).toBe(true)
  })

  it('loadCurrentLocation marks failure when geolocation is unavailable', async () => {
    vi.stubGlobal('navigator', { geolocation: undefined })

    const store = useLocationStore()
    await store.loadCurrentLocation()

    expect(store.status).toBe('error')
    expect(store.canEnterMsite).toBe(false)
  })

  it('loadCurrentLocation marks failure when reverse geocoding throws', async () => {
    const mockPosition = {
      coords: {
        latitude: 32.35,
        longitude: 113.54,
      },
    }
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: vi.fn().mockImplementation(success => success(mockPosition)) },
    })

    const reverseModule = await import('@/services/api/api-city')
    vi.spyOn(reverseModule, 'getReverseGeoCoding').mockRejectedValue(new Error('network error'))

    const store = useLocationStore()
    await store.loadCurrentLocation()

    expect(store.status).toBe('error')
    expect(store.canEnterMsite).toBe(false)
  })
})
