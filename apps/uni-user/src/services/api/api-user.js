// 登录、资料读取、登出与 web-user 同源；资料写入按各端页面分别接入。
// 不抽共享包的原因见迁移方案议题 7。
//
// 上传的区别只在传输层：web-user 传 FormData，这里传临时路径，由 platform/request
// 调用 uni.uploadFile；两端都复用 HTTP 层的鉴权、401 刷新和错误提示。

import { getRefreshToken } from '../http/auth-storage'
import { get, post, put } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

/** 获取当前手机号用户信息 */
export function getCustomerProfile() {
  return get(authEndpoints.customerProfile).then(res => (res?.data && res.code === 200 ? res.data : res))
}

/** 返回已保存的完整资料，页面用它回写 store，避免只改显示名而留下旧 nickname。 */
export function updateCustomerNickname(nickname) {
  return put(authEndpoints.customerNickname, { nickname }, {
    loadingText: '保存用户名中...',
  }).then(res => (res?.data && res.code === 200 ? res.data : res))
}

/** 获取用户信息 */
export const getUserInfo = getCustomerProfile

/** 上传会同时保存后端用户资料；返回持久路径，不能用选图的临时路径更新 store。 */
export function uploadUserAvatar(filePath) {
  return post(authEndpoints.customerAvatar, undefined, {
    upload: {
      filePath,
      name: 'file',
    },
    loadingText: '上传头像中...',
  }).then((res) => {
    const avatar = res?.data?.avatar
    return typeof avatar === 'string' ? avatar.trim() : ''
  })
}

export function signout() {
  return post(
    authEndpoints.customerLogout,
    { refreshToken: getRefreshToken() },
    { meta: { skipAuthRefresh: true } },
  )
}
