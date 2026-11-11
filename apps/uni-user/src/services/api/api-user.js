// ⚠️ 与 apps/web-user/src/services/api/api-user.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// 上传的区别只在传输层：web-user 传 FormData，这里传临时路径，由 platform/request
// 调用 uni.uploadFile；两端都复用 HTTP 层的鉴权、401 刷新和错误提示。

import { getRefreshToken } from '../http/auth-storage'
import { get, post } from '../http/http'

import { authEndpoints } from './endpoints/auth.endpoints'

/** 获取当前手机号用户信息 */
export function getCustomerProfile() {
  return get(authEndpoints.customerProfile).then(res => (res?.data && res.code === 200 ? res.data : res))
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
