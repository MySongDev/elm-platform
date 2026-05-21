import { describe, expect, it } from 'vitest'

import { normalizeLocatedCity } from './useHomeLocation'

describe('normalizeLocatedCity', () => {
  it('normalizes Ele.me reverse geocoding response fields', () => {
    const location = normalizeLocatedCity({
      name: '月河镇中心小学',
      address: '河南省南阳市桐柏县月河镇中心小学',
      city: '南阳市',
      city_id: 1667,
      latitude: 32.352996,
      longitude: 113.541179,
      geohash: 'wtb8p9wjv5x6',
      district_id: 1667,
    })

    expect(location).toEqual({
      latitude: 32.352996,
      longitude: 113.541179,
      geohash: 'wtb8p9wjv5x6',
      city: '南阳市',
      cityId: 1667,
      address: '河南省南阳市桐柏县月河镇中心小学',
      name: '月河镇中心小学',
      districtId: 1667,
    })
  })

  it('falls back to poi_name when name is missing', () => {
    expect(normalizeLocatedCity({ poi_name: '地面停车场' }).name).toBe('地面停车场')
  })
})
