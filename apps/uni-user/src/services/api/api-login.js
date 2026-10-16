// ⚠️ 与 apps/web-user/src/services/api/api-login.js 同源（逐行一致），修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
// 纯端点封装，零端依赖。

import { post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

export function sendCustomerSms(phone, scene) {
  return post(authEndpoints.customerSmsSend, {
    phone,
    scene,
  })
}

export function customerPasswordLogin(phone, password) {
  return post(authEndpoints.customerPasswordLogin, {
    phone,
    password,
  })
}

export function resetCustomerPassword(phone, smsCode, password) {
  return post(authEndpoints.customerPasswordReset, {
    phone,
    smsCode,
    password,
  })
}

export function customerSmsLogin(phone, smsCode) {
  return post(authEndpoints.customerSmsLogin, {
    phone,
    smsCode,
  })
}
