import { get, http, post } from '../http/http'

import { userEndpoints } from './endpoints/user.endpoints'

/** 获取地址列表 */
export const getAddress = user_id => get(userEndpoints.addresses(user_id))

/** 删除地址 */
export function deleteAddress(user_id, addressid) {
  return http({
    url: userEndpoints.addressDetail(user_id, addressid),
    params: {},
    method: 'DELETE',
  })
}

/** 新增收货地址 */
export function addAddress(params) {
  const required = [
    'user_id',
    'address',
    'address_detail',
    'geohash',
    'name',
    'phone',
    'sex',
  ]
  for (const field of required) {
    if (params[field] === undefined || params[field] === '') {
      throw new Error(`参数错误: ${field} 为必填项`)
    }
  }

  const payload = {
    tag: '家',
    tag_type: 2,
    poi_type: 0,
    phone_bk: '',
    ...params,
  }

  return post(userEndpoints.addresses(params.user_id), payload)
}
