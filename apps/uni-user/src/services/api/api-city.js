// ⚠️ 与 apps/web-user/src/services/api/api-city.js 同源，**按迁移范围裁剪**。
// 不抽共享包的原因见迁移方案议题 7。
//
// 裁剪依据（实测调用方）：
// - getReverseGeoCoding → store-locations（迁移目标）✅ 保留
// - getHotCity / getGroupCity → home.vue（**不迁移**，且依赖 27052 行的 china-cities）❌ 不搬
// - getCityInfo / searchCityInfo → city.vue（**不迁移**）❌ 不搬
// - getGuessCity → **零调用方**（web-user 侧就是死函数）❌ 不搬
// ⚠️ 不搬 china-cities：方案「不迁移（减负项）」明确它仅服务 city 页，不迁移即零负担。

import { get } from '../http/http'
import { cityEndpoints } from './endpoints/city.endpoints'

/** 逆地理编码：坐标 → 城市名/地址（store-locations 定位后补文案用） */
export function getReverseGeoCoding(latitude, longitude) {
  return get(cityEndpoints.reverseGeoCoding, {
    latitude,
    longitude,
  })
}
