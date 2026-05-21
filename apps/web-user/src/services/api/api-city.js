import { get } from '../http/http'

import { cityEndpoints } from './endpoints/city.endpoints'

/** 获取定位城市 */
export const getGuessCity = () => get(cityEndpoints.cities, { type: 'guess' })

/** 逆地理编码 */
export function getReverseGeoCoding(latitude, longitude) {
  return fetch(`${cityEndpoints.reverseGeoCoding}?latitude=${latitude}&longitude=${longitude}`)
    .then(res => res.json())
}

/** 获取热门城市 */
export const getHotCity = () => get(cityEndpoints.cities, { type: 'hot' })

/** 获取所有城市 */
export const getGroupCity = () => get(cityEndpoints.cities, { type: 'group' })

/** 获取城市信息 */
export const getCityInfo = number => get(cityEndpoints.cityInfo(number))

/** 根据城市id搜索城市信息 */
export async function searchCityInfo(city_id, keyword, type = 'search') {
  return get(cityEndpoints.searchPois, { city_id, keyword, type })
}
