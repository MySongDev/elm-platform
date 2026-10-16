/**
 * 平台适配收口层 —— 定位
 *
 * 替代 web-user `stores/modules/store-locations.js:111,119` 的
 * `globalThis.navigator?.geolocation.getCurrentPosition`。
 *
 * ⚠️ 方案 D1 明确：这**不是可选项，是功能正确性**。
 * 现有代码有优雅降级（:112-116 无 geolocation 则 setLocationFailed），
 * 所以小程序端定位会**静默失效但不崩溃** —— 这是隐蔽坑：
 * msite/shop/search 的位置相关功能全部拿不到坐标，而页面看起来正常。
 */

import { DEV_FALLBACK_LOCATION } from '@/config'

export interface Coordinates {
  latitude: number
  longitude: number
}

export type LocationErrorCode
  = 'permission-denied'
    | 'unavailable'
    | 'timeout'
    | 'unsupported'
    | 'unknown'

export interface LocationError {
  code: LocationErrorCode
  message: string
}

/**
 * 浏览器 geolocation 的 error.code 与小程序 errMsg 的归一映射。
 *
 * web-user 依赖 error.code 的语义（:136 注释写明 1=PERMISSION_DENIED,
 * 2=POSITION_UNAVAILABLE, 3=TIMEOUT），store 据此区分「用户拒绝」与「定位失败」。
 * 小程序只给 errMsg 字符串，这里翻译成同一套 code，让 store 逻辑不用改。
 */
function normalizeError(errMsg: string): LocationError {
  const message = errMsg || '未知定位错误'
  const lower = message.toLowerCase()

  // 用户拒绝授权。小程序端 errMsg 形如 "getLocation:fail auth deny"
  // 或 "getLocation:fail authorize no response"
  if (lower.includes('auth') || lower.includes('deny') || lower.includes('denied')) {
    return {
      code: 'permission-denied',
      message,
    }
  }
  if (lower.includes('timeout')) {
    return {
      code: 'timeout',
      message,
    }
  }
  // 系统定位服务关闭、无信号等
  if (
    lower.includes('fail')
    || lower.includes('unavailable')
    || lower.includes('error')
  ) {
    return {
      code: 'unavailable',
      message,
    }
  }

  return {
    code: 'unknown',
    message,
  }
}

export interface GetLocationOptions {
  /**
   * 坐标系。
   * ⚠️ 默认 'gcj02'（国测局坐标，中国大陆地图标准）而非 'wgs84'（GPS 原始坐标）。
   * 后端 elm 接口的经纬度体系与 web-user 一致（浏览器 geolocation 给 wgs84，
   * 但国内地图服务普遍按 gcj02 处理）—— 若定位点偏移几百米，先查这里。
   */
  type?: 'wgs84' | 'gcj02'
  /** 超时（毫秒）。对齐 web-user 的 :143 `timeout: 10000` */
  timeout?: number
  /**
   * 是否使用高精度定位。
   * ⚠️ 小程序端 isHighAccuracy + highAccuracyExpireTime 会显著增加耗时，
   * 外卖场景（选地址）不需要米级精度 → 默认关闭，与 web-user 的
   * `maximumAge: 600000`（允许用 10 分钟内的缓存）意图一致。
   */
  isHighAccuracy?: boolean
}

/**
 * 获取当前坐标。
 *
 * 语义与 web-user 的 `loadCurrentLocation` 对齐：
 * - 成功 → resolve 坐标
 * - 失败（含用户拒绝）→ **resolve(null) 而非 reject**
 *   ⚠️ 这是刻意设计：现有 store 的调用方（msite 等）把「定位失败」当正常分支处理
 *   （显示「获取定位失败，请重新定位」并允许手动选城），不该抛异常打断流程。
 */
export function getLocation(
  options: GetLocationOptions = {},
): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    // 小程序端 uni.getLocation 在部分场景（如未配置 permission）会直接抛同步异常
    try {
      uni.getLocation({
        type: options.type ?? 'gcj02',
        isHighAccuracy: options.isHighAccuracy ?? false,
        // ⚠️ 注意：uni.getLocation 没有 timeout 参数（与浏览器 geolocation 不同），
        // 高精度模式下才用 highAccuracyExpireTime。这里用外层 Promise.race 兜超时，
        // 避免小程序定位挂起时 store 永远停在 'locating' 状态。
        success: (result) => {
          const { latitude, longitude } = result

          // 小程序偶尔返回 0/0（定位失败的另一种表现），必须当作失败处理，
          // 否则会把用户定位到几内亚湾
          if (!latitude || !longitude) {
            resolve(null)
            return
          }
          resolve({
            latitude,
            longitude,
          })
        },
        fail: (error) => {
          const normalized = normalizeError(error?.errMsg ?? '')
          console.error(
            '[platform/location] 获取地理位置失败:',
            normalized.code,
            normalized.message,
          )
          resolve(null)
        },
      })
    }
    catch (error) {
      console.error('[platform/location] uni.getLocation 调用异常:', error)
      resolve(null)
    }
  })
}

/**
 * 带超时的定位。
 * ⚠️ 必须用这个而非裸 getLocation：uni.getLocation 在用户未响应授权弹窗时会**无限挂起**
 * （小程序端授权弹窗没有超时机制），而 web-user 的浏览器实现有 `timeout: 10000`。
 * 不兜超时会导致 store 的 status 永远停在 'locating'，骨架屏不消失。
 *
 * ⚠️ 本文件两个消费方（store-locations.js:134、services/http/request.js:223）
 * 都走这个入口，没有一个直接调裸 getLocation → 开发期兜底坐标放在这一层即可全覆盖。
 *
 * ★ 开发期兜底坐标（DEV_FALLBACK_LOCATION，值与门控都在 config）为什么存在
 * —— 2026-09-29 实测：微信自 2022-07-14 起，`wx.getLocation` 除了在 app.json 的
 * `requiredPrivateInfos` 里声明，还必须**绑定真实 appid 并在公众平台申请开通该接口
 * 权限**。本项目 manifest.json 的 appid 为空（project.config.json:16 是
 * `touristappid` 游客模式）→ 定位在开发者工具里必然 fail → 坐标恒为 null。
 *
 * 后果是一条**静默失效链**（不崩溃、页面看起来正常）：
 * request.ts 的 serializeQuery 跳过 null 参数 → 商家接口的 latitude/longitude
 * 根本不发出去 → 后端返回 `{"status":0,"type":"ERROR_PARAMS",
 * "message":"latitude参数错误"}` → policies/business.js:22-29 判为业务错误并抛异常
 * → useLoadMore 的 list 恒为空 → ShopList 渲染 DefaultEmpty。
 * 生产构建下 DEV_FALLBACK_LOCATION 恒为 null，假坐标绝不会带到线上。
 */
export async function getLocationWithTimeout(
  timeoutMs = 10000,
  options: GetLocationOptions = {},
): Promise<Coordinates | null> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const located = await Promise.race([
      getLocation(options),
      new Promise<null>((resolve) => {
        timer = setTimeout(resolve, timeoutMs, null)
      }),
    ])

    if (located) {
      return located
    }

    // 定位失败（拒绝授权 / 超时 / 游客模式无接口权限）→ 开发期兜底坐标。
    // ⚠️ 用 warn 而非 error：这是预期的开发期降级，不是故障；但必须留痕，
    // 否则开发者会误以为拿到的是真实定位（比如排查「商家距离不对」时白找半天）。
    if (DEV_FALLBACK_LOCATION) {
      console.warn(
        '[platform/location] 定位失败，开发期使用兜底坐标:',
        DEV_FALLBACK_LOCATION.latitude,
        DEV_FALLBACK_LOCATION.longitude,
      )
      return DEV_FALLBACK_LOCATION
    }

    return null
  }
  finally {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
  }
}

/**
 * 打开系统定位设置页（用户拒绝授权后的引导）。
 *
 * ⚠️ 小程序端特有能力：浏览器只能提示「请在系统设置里开启定位」，
 * 小程序可以直接跳转授权设置页。用户拒绝后再次调 getLocation 会**直接失败且不弹窗**，
 * 必须靠这个引导 —— 否则用户永远无法授权，定位功能彻底不可用。
 *
 * @returns true = 用户从设置页返回（不保证已开启，调用方应重新尝试定位）
 */
export function openLocationSetting(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.openSetting({
      success: () => resolve(true),
      fail: () => resolve(false),
    })
  })
}

/**
 * 查询定位授权状态。
 * @returns true = 已授权；false = 已拒绝；null = 从未询问过
 */
export async function checkLocationPermission(): Promise<boolean | null> {
  return new Promise((resolve) => {
    // ⚠️ getSetting 返回的 authSetting 里，未询问过的权限**不会出现在对象里**
    // （不是 false），必须区分「已拒绝」与「从未询问」—— 前者要引导去设置页，
    // 后者直接调 getLocation 即可触发授权弹窗。
    uni.getSetting({
      success: (result) => {
        const status = result.authSetting?.['scope.userLocation']

        if (status === undefined) {
          resolve(null)
          return
        }
        resolve(Boolean(status))
      },
      fail: () => resolve(null),
    })
  })
}
