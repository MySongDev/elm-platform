import { defineStore } from 'pinia'

import { getStore } from '@/untils/storage'

export const useLocationStore = defineStore('location', {
  state: () => {
    const cache = getStore('location') || {}

    return {
      geohash: cache.geohash || null,
      latitude: cache.latitude || null,
      longitude: cache.longitude || null,
      city: cache.city || '',
      cityId: cache.cityId || null,
      address: cache.address || '',
      name: cache.name || '',
      districtId: cache.districtId || null,
    }
  },

  actions: {
    setLocation(lat, lng, location = {}) {
      this.latitude = lat
      this.longitude = lng

      if (location.geohash)
        this.geohash = location.geohash
      if (location.city)
        this.city = location.city
      if (location.cityId)
        this.cityId = location.cityId
      if (location.address)
        this.address = location.address
      if (location.name)
        this.name = location.name
      if (location.districtId)
        this.districtId = location.districtId
    },
  },
})
