import { get, http, post } from '../http/http'

import { userEndpoints } from './endpoints/user.endpoints'

/** 获取地址列表（身份由请求头中的令牌决定） */
export const getAddress = () => get(userEndpoints.addresses)

/** 删除地址 */
export function deleteAddress(addressId) {
  return http({
    url: userEndpoints.addressDetail(addressId),
    params: {},
    method: 'DELETE',
  })
}

/** 新增收货地址 */
export function addAddress(params) {
  const required = [
    'address',
    'addressDetail',
    'name',
    'phone',
  ]
  for (const field of required) {
    if (params[field] === undefined || params[field] === '') {
      throw new Error(`参数错误: ${field} 为必填项`)
    }
  }

  const payload = {
    tag: '家',
    tagType: 2,
    poiType: 0,
    sex: 1,
    ...params,
  }

  return post(userEndpoints.addresses, payload)
}
