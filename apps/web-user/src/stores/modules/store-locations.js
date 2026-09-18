import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getReverseGeoCoding } from '@/services/api/api-city'
import { getStore, setStore } from '@/utils/storage/storage'

const STORAGE_KEY = 'location'

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
  // 从 localStorage 恢复上次定位快照：二次进入/刷新可立即用旧坐标发请求，
  // 无需等浏览器重新定位（仅持久化 location 这一个 store，不恢复全局 $subscribe）。
  const cache = getStore(STORAGE_KEY) || {}

  const geohash = ref(cache.geohash || null)
  const latitude = ref(cache.latitude || null)
  const longitude = ref(cache.longitude || null)
  const city = ref(cache.city || '')
  const cityId = ref(cache.cityId || null)
  const address = ref(cache.address || '')
  const name = ref(cache.name || '')
  const districtId = ref(cache.districtId || null)

  // 浏览器定位流程状态：locating | success | error，仅描述"这次定位成功没有"。
  // 已有缓存坐标时直接视作 success，避免秒开时 loading 判据误显骨架屏。
  const status = ref(latitude.value && longitude.value ? 'success' : 'locating')

  // 是否已具备可用坐标。不区分来源（浏览器定位 / 手动选城 / 缓存），
  // 与 msite 内 `!latitude || !longitude` 的判据保持一致。
  const canEnterMsite = computed(() => Boolean(latitude.value && longitude.value))

  // 头部定位文案：按"地名 → 流程状态"优先级派生，供 HeadTop 等展示组件直接用
  const locationText = computed(() => {
    if (name.value)
      return name.value
    if (status.value === 'locating')
      return '正在定位...'
    if (status.value === 'error')
      return '获取定位失败，请重新定位'
    return '当前未定位'
  })

  // 定位快照落盘，仅存坐标与地名等可复用字段
  function persist() {
    setStore(STORAGE_KEY, {
      geohash: geohash.value,
      latitude: latitude.value,
      longitude: longitude.value,
      city: city.value,
      cityId: cityId.value,
      address: address.value,
      name: name.value,
      districtId: districtId.value,
    })
  }

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

    persist()
  }

  function applyLocatedCity(location = {}) {
    const normalized = normalizeLocatedLocation(location)
    status.value = 'success'
    // 反查结果可能不含坐标（或不如 GPS 精确），缺失时保留已落地的坐标
    setLocation(
      normalized.latitude ?? latitude.value,
      normalized.longitude ?? longitude.value,
      normalized,
    )
  }

  function setLocationFailed() {
    status.value = 'error'
  }

  // 浏览器定位。坐标一到手就落进 store 并 resolve，商家列表可立即发请求；
  // 城市名反查作为后补、不阻塞坐标可用。
  // silent=true 用于已有旧坐标时的后台静默刷新：不打回 locating，失败也不覆盖为 error。
  function loadCurrentLocation({ silent = false } = {}) {
    if (!silent)
      status.value = 'locating'

    const geolocation = globalThis.navigator?.geolocation
    if (!geolocation) {
      if (!silent)
        setLocationFailed()
      return Promise.resolve(null)
    }

    return new Promise((resolve) => {
      geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords
          // 坐标先落地：getShopList 无需再等一个反查网络往返
          status.value = 'success'
          setLocation(lat, lng)
          resolve({
            latitude: lat,
            longitude: lng,
          })

          // 城市名/地址等文案后补，失败也不影响已可用的坐标
          getReverseGeoCoding(lat, lng)
            .then(applyLocatedCity)
            .catch(error => console.error('定位城市反查失败:', error))
        },
        (error) => {
          // error.code: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
          console.error('获取地理位置失败:', error?.code, error?.message)
          if (!silent)
            setLocationFailed()
          resolve(null)
        },
        {
          timeout: 10000,
          maximumAge: 600000,
        },
      )
    })
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
    locationText,
    setLocation,
    applyLocatedCity,
    setLocationFailed,
    loadCurrentLocation,
  }
})
