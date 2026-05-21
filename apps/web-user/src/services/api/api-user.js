import { getStore } from '@/untils/storage'

import { get, post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'
import { userEndpoints } from './endpoints/user.endpoints'

/** 获取用户信息 */
export const getUserInfo = () => get(userEndpoints.info, { user_id: getStore('user_id') })

/** 改密码 */
export function changePassword(username, oldpassWord, newpassword, confirmpassword, captcha_code) {
  return post(authEndpoints.changePassword, { username, oldpassWord, newpassword, confirmpassword, captcha_code })
}

/** 退出登录 */
export const signout = () => get(authEndpoints.signout)

/** 上传用户头像 */
export function uploadUserAvatar(userId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return post(userEndpoints.avatar(userId), formData)
}
