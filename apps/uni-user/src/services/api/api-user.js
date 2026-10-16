// ⚠️ 与 apps/web-user/src/services/api/api-user.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ★ 与 web-user 的差异：uploadUserAvatar **未搬**。
// web-user 用 `new FormData()` + axios 上传，小程序端没有 FormData，
// 头像上传要走 uni.uploadFile（Batch 3 profile 页的工作，届时在此补接缝）。

import { getRefreshToken } from '../http/auth-storage'
import { get, post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

/** 获取当前手机号用户信息 */
export function getCustomerProfile() {
  return get(authEndpoints.customerProfile).then(res => (res?.data && res.code === 200 ? res.data : res))
}

/** 获取用户信息 */
export const getUserInfo = getCustomerProfile

export function signout() {
  return post(
    authEndpoints.customerLogout,
    { refreshToken: getRefreshToken() },
    { meta: { skipAuthRefresh: true } },
  )
}
