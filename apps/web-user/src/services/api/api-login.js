import { post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

/** 获取图片验证码 */
export async function getCaptchas() {
  const res = await post(authEndpoints.captchas, {})
  const { code } = res || {}

  if (!code)
    throw new Error(res?.message || '验证码获取失败')

  return code
}

/** 账号密码登录 */
export function accountLogin(username, password, captcha_code) {
  return post(authEndpoints.login, { username, password, captcha_code })
}

/** 手机号登录 */
export function sendLogin(code, mobile, validate_token) {
  return post(authEndpoints.loginByMobile, { code, mobile, validate_token })
}
