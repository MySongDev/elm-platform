import { getRefreshToken } from '../http/auth-storage'
import { get, post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

/** 获取当前手机号用户信息 */
export function getCustomerProfile() {
  return get(authEndpoints.customerProfile).then(res => (res?.data && res.code === 200 ? res.data : res))
}

/** 获取用户信息 */
export const getUserInfo = getCustomerProfile

/** 上传当前用户头像（身份由请求头中的令牌决定） */
export function uploadUserAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return post(authEndpoints.customerAvatar, formData)
}
export function signout() {
  return post(
    authEndpoints.customerLogout,
    { refreshToken: getRefreshToken() },
    { meta: { skipAuthRefresh: true } },
  )
}
