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
