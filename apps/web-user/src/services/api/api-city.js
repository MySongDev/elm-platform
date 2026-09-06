// import { chinaCities, citiesByLetter } from '@/data/china-cities'
import { citiesByLetter, hotCities } from '@/data/china-cities'

import { get } from '../http/http'
import { cityEndpoints } from './endpoints/city.endpoints'

/** 获取定位城市 */
export const getGuessCity = () => get(cityEndpoints.cities, { type: 'guess' })

/** 逆地理编码 */
export function getReverseGeoCoding(latitude, longitude) {
  return get(cityEndpoints.reverseGeoCoding, {
    latitude,
    longitude,
  })
}

/** 获取热门城市 - 使用本地数据 */
export const getHotCity = () => Promise.resolve(hotCities)

/** 获取所有城市 - 使用本地数据 */
export const getGroupCity = () => Promise.resolve(citiesByLetter)

/** 获取城市信息 */
export const getCityInfo = number => get(cityEndpoints.cityInfo(number))

/** 根据城市id搜索城市信息 */
export async function searchCityInfo(city_id, keyword, type = 'search') {
  return get(cityEndpoints.searchPois, {
    city_id,
    keyword,
    type,
  })
}
