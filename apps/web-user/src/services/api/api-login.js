import { post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

function unwrapCustomerAuthResponse(res) {
  return res?.data && res.code === 200 ? res.data : res
}

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
  return post(authEndpoints.login, {
    username,
    password,
    captcha_code,
  })
}

/** 手机号登录 */
export function sendLogin(code, mobile, validate_token) {
  return post(authEndpoints.loginByMobile, {
    code,
    mobile,
    validate_token,
  })
}

export function sendCustomerSms(phone, scene) {
  return post(authEndpoints.customerSmsSend, {
    phone,
    scene,
  })
}

export function customerRegister(phone, smsCode, password) {
  return post(authEndpoints.customerRegister, {
    phone,
    smsCode,
    password: password || undefined,
  })
    .then(unwrapCustomerAuthResponse)
}

export function customerPasswordLogin(phone, password) {
  return post(authEndpoints.customerPasswordLogin, {
    phone,
    password,
  })
    .then(unwrapCustomerAuthResponse)
}

export function customerSmsLogin(phone, smsCode) {
  return post(authEndpoints.customerSmsLogin, {
    phone,
    smsCode,
  })
    .then(unwrapCustomerAuthResponse)
}

export function customerRefreshToken(refreshToken) {
  return post(authEndpoints.customerRefresh, { refreshToken }, { meta: { skipAuthRefresh: true } })
    .then(unwrapCustomerAuthResponse)
}
