import { computed, ref } from 'vue'

import { API_BASE_URL } from '@/config'
import { useLocationStore } from '@/stores/modules/store-locations'

interface LocatedLocation {
  latitude?: number
  longitude?: number
  geohash?: string
  city?: string
  city_id?: number
  district_id?: number
  id?: number
  address?: string
  name?: string
  poi_name?: string
}

interface NormalizedLocation {
  latitude?: number
  longitude?: number
  geohash?: string
  city: string
  cityId: number | null
  address: string
  name: string
  districtId: number | null
}

interface UseHomeLocationOptions {
  geolocation?: Geolocation
  reverseGeoCoding?: (latitude: number, longitude: number) => Promise<LocatedLocation>
}

function defaultReverseGeoCoding(latitude: number, longitude: number): Promise<LocatedLocation> {
  return fetch(`${API_BASE_URL}/restapi/bgs/poi/reverse_geo_coding?latitude=${latitude}&longitude=${longitude}`)
    .then(res => res.json())
}

export function normalizeLocatedLocation(location: LocatedLocation = {}): NormalizedLocation {
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

export const normalizeLocatedCity = normalizeLocatedLocation

export function useHomeLocation(options: UseHomeLocationOptions = {}) {
  const {
    geolocation = globalThis.navigator?.geolocation,
    reverseGeoCoding = defaultReverseGeoCoding,
  } = options

  const locationStore = useLocationStore()
  const locationStatus = ref<'locating' | 'success' | 'error'>('locating')
  const locatedName = ref('正在定位...')

  const locationText = computed(() => {
    if (locationStatus.value === 'error')
      return '获取定位失败，请重新定位'
    return locatedName.value
  })

  const canEnterMsite = computed(() =>
    locationStatus.value === 'success' && locationStore.latitude && locationStore.longitude,
  )

  function setCityLocation(latitude?: number, longitude?: number, location: Partial<NormalizedLocation> = {}) {
    if (!latitude || !longitude)
      return

    locationStore.setLocation(latitude, longitude, location)
  }

  function applyLocatedCity(location: LocatedLocation = {}) {
    const normalized = normalizeLocatedLocation(location)
    locatedName.value = normalized.name || '定位成功'
    locationStatus.value = 'success'
    setCityLocation(normalized.latitude, normalized.longitude, normalized)
  }

  function setLocationFailed() {
    locatedName.value = ''
    locationStatus.value = 'error'
  }

  async function loadCurrentLocation() {
    locationStatus.value = 'locating'
    locatedName.value = '正在定位...'

    if (!geolocation) {
      setLocationFailed()
      return
    }

    geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const location = await reverseGeoCoding(latitude, longitude)
        applyLocatedCity(location)
      }
      catch (error) {
        console.error('定位城市反查失败:', error)
        setLocationFailed()
      }
    }, (error) => {
      console.log(`定位失败: ${error.message}`)
      setLocationFailed()
    })
  }

  return {
    locationStore,
    locationStatus,
    locationText,
    canEnterMsite,
    setCityLocation,
    applyLocatedCity,
    setLocationFailed,
    loadCurrentLocation,
  }
}
