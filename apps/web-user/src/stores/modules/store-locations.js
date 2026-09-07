import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getReverseGeoCoding } from '@/services/api/api-city'

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
  const geohash = ref(null)
  const latitude = ref(null)
  const longitude = ref(null)
  const city = ref('')
  const cityId = ref(null)
  const address = ref('')
  const name = ref('')
  const districtId = ref(null)

  // 浏览器定位流程状态：locating | success | error，仅描述"这次定位成功没有"
  const status = ref('locating')

  // 是否已具备可用坐标。不区分来源（浏览器定位 / 手动选城 / 缓存），
  // 与 msite 内 `!latitude || !longitude` 的判据保持一致。
  const canEnterMsite = computed(() => Boolean(latitude.value && longitude.value))

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
    status.value = 'success'
    setLocation(normalized.latitude, normalized.longitude, normalized)
  }

  function setLocationFailed() {
    status.value = 'error'
  }

  async function loadCurrentLocation() {
    status.value = 'locating'

    const geolocation = globalThis.navigator?.geolocation

    if (!geolocation) {
      setLocationFailed()
      return null
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
    canEnterMsite,
    setLocation,
    applyLocatedCity,
    setLocationFailed,
    loadCurrentLocation,
  }
})
