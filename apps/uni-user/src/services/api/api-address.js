// 地址请求只走公共HTTP层；整表单更新用PUT，不给小程序强加PATCH。
import { del, get, post, put } from '../http/http'
import { userEndpoints } from './endpoints/user.endpoints'

export const getAddress = () => get(userEndpoints.addresses)
export const getAddressDetail = id => get(userEndpoints.addressDetail(id))
export const deleteAddress = id => del(userEndpoints.addressDetail(id))
export const setDefaultAddress = id => post(userEndpoints.addressDefault(id))

function buildPayload(params) {
  for (const field of ['address', 'name', 'phone']) {
    if (typeof params?.[field] !== 'string' || !params[field].trim())
      throw new Error(`参数错误: ${field} 为必填项`)
  }
  return {
    tag: '家',
    tagType: 2,
    poiType: 0,
    sex: 1,
    ...params,
    // 门牌选填，但后端必须收到字符串，不能把空值省略成缺字段。
    addressDetail: params.addressDetail ?? '',
  }
}

export const addAddress = params => post(userEndpoints.addresses, buildPayload(params))
export const updateAddress = (id, params) => put(userEndpoints.addressDetail(id), buildPayload(params))
