// import { API_BASE_URL } from '@/config'

export const cityEndpoints = {
  cities: '/v1/cities',
  cityInfo: cityId => `/v1/cities/${cityId}`,
  reverseGeoCoding: `/restapi/bgs/poi/reverse_geo_coding`,
  searchPois: '/v1/pois',
}
