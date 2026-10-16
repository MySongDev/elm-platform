// ⚠️ 与 apps/web-user/src/services/api/api-address.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：
// 1. `http({ method: 'DELETE' })` → `del()`。uni.request 不支持 PATCH 但支持 DELETE，
//    web-user 侧为了不走 axios 的 verb 简写而手写了 method 大小写，uni-user 侧
//    http.js 已提供 del() 便捷函数，直接用
// 2. 导入路径与 web-user 一致（相对目录结构相同），无额外平台分支

import { del, get, post } from '../http/http'

import { userEndpoints } from './endpoints/user.endpoints'

/** 获取地址列表（身份由请求头中的令牌决定） */
export const getAddress = () => get(userEndpoints.addresses)

/** 删除地址 */
export function deleteAddress(addressId) {
  return del(userEndpoints.addressDetail(addressId))
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
