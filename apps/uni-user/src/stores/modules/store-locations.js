// ⚠️ 与 apps/web-user/src/stores/modules/store-locations.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异（方案 D1，**不是可选项，是功能正确性**）：
// `loadCurrentLocation` 从 `navigator.geolocation.getCurrentPosition` 换成
// platform/location 的 `getLocationWithTimeout`（uni.getLocation + 超时兜底）。
// web-user 的浏览器定位有优雅降级（无 geolocation 则 setLocationFailed），
// 小程序端若照搬会**静默失效但不崩溃** —— msite/shop/search 的位置相关功能
// 全部拿不到坐标，而页面看起来正常。这是隐蔽坑，必须换实现。
//
// ⚠️ 两个语义差异已核实并对齐：
// 1. 超时：web-user 浏览器给 timeout:10000；uni.getLocation 无 timeout 参数，
//    由 getLocationWithTimeout 的 Promise.race 兜（默认 10000，一致）
// 2. maximumAge:600000（允许 10 分钟缓存）：uni.getLocation 无对等参数，
//    但本 store 自己持久化快照（persist），二次进入直接读缓存坐标 →
//    「允许旧坐标」的语义由 store 层承担，不丢

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getLocationWithTimeout } from '@/platform/location'
import { getStore, setStore } from '@/platform/storage'
import { getReverseGeoCoding } from '@/services/api/api-city'

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
  // 从 storage 恢复上次定位快照：二次进入可立即用旧坐标发请求，无需等重新定位
  const cache = getStore(STORAGE_KEY) || {}

  const geohash = ref(cache.geohash || null)
  const latitude = ref(cache.latitude || null)
  const longitude = ref(cache.longitude || null)
  const city = ref(cache.city || '')
  const cityId = ref(cache.cityId || null)
  const address = ref(cache.address || '')
  const name = ref(cache.name || '')
  const districtId = ref(cache.districtId || null)

  // 定位流程状态：locating | success | error，仅描述"这次定位成功没有"。
  // 已有缓存坐标时直接视作 success，避免秒开时 loading 判据误显骨架屏。
  const status = ref(latitude.value && longitude.value ? 'success' : 'locating')

  // 是否已具备可用坐标。不区分来源（定位 / 手动选城 / 缓存），
  // 与 msite 内 `!latitude || !longitude` 的判据保持一致。
  const canEnterMsite = computed(() => Boolean(latitude.value && longitude.value))

  // 头部定位文案：按"地名 → 流程状态"优先级派生，供展示组件直接用
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

  /**
   * 定位。坐标一到手就落进 store 并 resolve，商家列表可立即发请求；
   * 城市名反查作为后补、不阻塞坐标可用。
   * silent=true 用于已有旧坐标时的后台静默刷新：不打回 locating，失败也不覆盖为 error。
   *
   * ⚠️ 返回 Promise（与 web-user 一致）：调用方可能 `.then()` 链式使用。
   * 函数体已无 await（反查改为后补），故不用 async 关键字（require-await），
   * 显式 Promise.resolve 保持契约。
   */
  function loadCurrentLocation({ silent = false } = {}) {
    if (!silent)
      status.value = 'locating'

    return getLocationWithTimeout(10000).then((located) => {
      if (!located) {
        // 定位失败（含用户拒绝、超时、系统定位关闭）。
        // ⚠️ 用户拒绝授权时小程序端再调 getLocation 会直接失败且不弹窗，
        // 需引导去设置页 —— 由调用方（msite 页）决定何时调 openLocationSetting，
        // store 层不主动弹（避免每次进页面都打扰）。
        if (!silent)
          setLocationFailed()
        return null
      }

      const { latitude: lat, longitude: lng } = located
      // 坐标先落地：getShopList 无需再等一个反查网络往返
      status.value = 'success'
      setLocation(lat, lng)

      // ⚠️ 城市名/地址等文案**后补、不阻塞**坐标可用（与 web-user 的 resolve 时序一致）：
      // 反查失败也不影响已可用的坐标，且调用方不必多等一个网络往返
      getReverseGeoCoding(lat, lng)
        .then(applyLocatedCity)
        .catch((error) => {
          console.error('定位城市反查失败:', error)
        })

      return {
        latitude: lat,
        longitude: lng,
      }
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
