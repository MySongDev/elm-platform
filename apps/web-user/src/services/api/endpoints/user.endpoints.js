export const userEndpoints = {
  info: '/v1/user',
  avatar: userId => `/eus/v1/users/${userId}/avatar`,
  addresses: userId => `/v1/users/${userId}/addresses`,
  addressDetail: (userId, addressId) => `/v1/users/${userId}/addresses/${addressId}`,
}
