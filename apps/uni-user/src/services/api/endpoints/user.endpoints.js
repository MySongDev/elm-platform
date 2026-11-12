// uni-user地址契约：整表单编辑走PUT，默认切换有独立入口。
export const userEndpoints = {
  addresses: '/customer-addresses',
  addressDetail: id => `/customer-addresses/${id}`,
  addressDefault: id => `/customer-addresses/${id}/default`,
}
