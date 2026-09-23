import { post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

function unwrapCustomerAuthResponse(res) {
  return res?.data && res.code === 200 ? res.data : res
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

export function resetCustomerPassword(phone, smsCode, password) {
  return post(authEndpoints.customerPasswordReset, {
    phone,
    smsCode,
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
