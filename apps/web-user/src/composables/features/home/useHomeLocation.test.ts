import { describe, expect, it } from 'vitest'

import { normalizeLocatedCity } from './useHomeLocation'

describe('normalizeLocatedCity', () => {
  it('normalizes Ele.me reverse geocoding response fields', () => {
    const location = normalizeLocatedCity({
      name: 'xxxxxxx',
      address: 'xxxxxxx',
      city: 'xxxxxxx',
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
      city: 'xxxxxxx',
      cityId: 1667,
      address: 'xxxxxxx',
      name: 'xxxxxxx',
      districtId: 1667,
    })
  })

  it('falls back to poi_name when name is missing', () => {
    expect(normalizeLocatedCity({ poi_name: '地面停车场' }).name).toBe('地面停车场')
  })
})
