import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setStore } from '@/utils/storage/storage'
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
    expect(store.locationText).toBe('月河镇')
  })

  it('falls back to empty fields when nothing is provided', () => {
    const store = useLocationStore()
    store.setLocation(1, 2, {})

    expect(store.latitude).toBe(1)
    expect(store.longitude).toBe(2)
    expect(store.geohash).toBeNull()
    expect(store.city).toBe('')
    expect(store.address).toBe('')
    // 无缓存时初始 status 为 locating，locationText 反映流程状态
    expect(store.locationText).toBe('正在定位...')
  })

  it('canEnterMsite tracks coordinate availability regardless of source', () => {
    const store = useLocationStore()
    expect(store.canEnterMsite).toBe(false)

    // 手动选城（不依赖浏览器定位成功）也应算可进入
    store.setLocation(32.35, 113.54, { name: '月河镇' })
    expect(store.canEnterMsite).toBe(true)
  })

  it('locationText falls back to status text when no name is available', () => {
    const store = useLocationStore()
    // 无缓存时初始 status 为 locating
    expect(store.locationText).toBe('正在定位...')

    store.setLocationFailed()
    expect(store.locationText).toBe('获取定位失败，请重新定位')

    store.setLocation(32.35, 113.54, { name: '月河镇' })
    expect(store.locationText).toBe('月河镇')
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
    expect(store.locationText).toBe('月河镇')
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

  it('keeps coordinates usable when reverse geocoding fails', async () => {
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

    // 坐标已随定位落地：即使城市名反查失败，商家列表仍可用
    expect(store.latitude).toBe(32.35)
    expect(store.longitude).toBe(113.54)
    expect(store.status).toBe('success')
    expect(store.canEnterMsite).toBe(true)
    expect(store.city).toBe('')
  })

  it('restores the last located snapshot from localStorage on init', () => {
    setStore('location', {
      latitude: 31.23,
      longitude: 121.47,
      geohash: 'wtw3sm0k',
      city: '上海市',
    })

    const store = useLocationStore()

    expect(store.latitude).toBe(31.23)
    expect(store.longitude).toBe(121.47)
    expect(store.city).toBe('上海市')
    // 已有缓存坐标视作定位成功，避免秒开时误显骨架屏
    expect(store.status).toBe('success')
    expect(store.canEnterMsite).toBe(true)
  })
})
