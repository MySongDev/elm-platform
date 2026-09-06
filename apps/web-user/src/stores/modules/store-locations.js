import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getReverseGeoCoding } from '@/services/api/api-city'
import { getStore } from '@/utils/storage/storage'

function normalizeLocatedLocation(location = {}) {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    geohash: location.geohash,
    city: location.city || location.name || '',
    cityId: location.city_id || location.district_id || location.id || null,
    address: location.address || '',
    name: location.name || location.poi_name || location.city || '',
    districtId: location.district_id || null,
  }
}

export const useLocationStore = defineStore('location', () => {
  const cache = getStore('location') || {}

  const geohash = ref(cache.geohash || null)
  const latitude = ref(cache.latitude || null)
  const longitude = ref(cache.longitude || null)
  const city = ref(cache.city || '')
  const cityId = ref(cache.cityId || null)
  const address = ref(cache.address || '')
  const name = ref(cache.name || '')
  const districtId = ref(cache.districtId || null)

  const status = ref('locating')
  const locatedName = ref('正在定位...')

  const locationText = computed(() => {
    if (status.value === 'error')
      return '获取定位失败，请重新定位'
    return locatedName.value
  })

  const canEnterMsite = computed(() =>
    status.value === 'success' && Boolean(latitude.value && longitude.value),
  )

  function setLocation(lat, lng, location = {}) {
    latitude.value = lat
    longitude.value = lng

    if (location.geohash)
      geohash.value = location.geohash
    if (location.city)
      city.value = location.city
    if (location.cityId)
      cityId.value = location.cityId
    if (location.address)
      address.value = location.address
    if (location.name)
      name.value = location.name
    if (location.districtId)
      districtId.value = location.districtId
  }

  function applyLocatedCity(location = {}) {
    const normalized = normalizeLocatedLocation(location)
    locatedName.value = normalized.name || '定位成功'
    status.value = 'success'
    setLocation(normalized.latitude, normalized.longitude, normalized)
  }

  function setLocationFailed() {
    locatedName.value = ''
    status.value = 'error'
  }

  async function loadCurrentLocation() {
    status.value = 'locating'
    locatedName.value = '正在定位...'

    const geolocation = globalThis.navigator?.geolocation
    if (!geolocation) {
      setLocationFailed()
      return
    }

    geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lng } = position.coords
          const location = await getReverseGeoCoding(lat, lng)
          applyLocatedCity(location)
        }
        catch (error) {
          console.error('定位城市反查失败:', error)
          setLocationFailed()
        }
      },
      () => {
        setLocationFailed()
      },
    )
  }

  return {
    geohash,
    latitude,
    longitude,
    city,
    cityId,
    address,
    name,
    districtId,
    status,
    locatedName,
    locationText,
    canEnterMsite,
    setLocation,
    applyLocatedCity,
    setLocationFailed,
    loadCurrentLocation,
  }
})
