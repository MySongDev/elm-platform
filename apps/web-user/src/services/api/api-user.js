import { getRefreshToken } from '../http/auth-storage'
import { get, post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'
import { userEndpoints } from './endpoints/user.endpoints'

/** 获取旧版兼容用户信息（身份由请求头中的令牌决定） */
export const getLegacyUserInfo = () => get(userEndpoints.info)

/** 获取当前手机号用户信息 */
export function getCustomerProfile() {
  return get(authEndpoints.customerProfile).then(res => (res?.data && res.code === 200 ? res.data : res))
}

/** 获取用户信息 */
export const getUserInfo = getCustomerProfile

/** 改密码 */
export function changePassword(username, oldpassWord, newpassword, confirmpassword, captcha_code) {
  return post(authEndpoints.changePassword, {
    username,
    oldpassWord,
    newpassword,
    confirmpassword,
    captcha_code,
  })
}

/** 退出登录 */
export function signout() {
  return post(
    authEndpoints.customerLogout,
    { refreshToken: getRefreshToken() },
    { meta: { skipAuthRefresh: true } },
  )
}

/** 上传用户头像 */
export function uploadUserAvatar(userId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return post(userEndpoints.avatar(userId), formData)
}
