export interface CustomerAddressCreateInput {
  name: string
  phone: string
  phoneBk?: string
  address: string
  addressDetail: string
  geohash?: string
  sex?: number
  tag?: string
  tagType?: number
  poiType?: number
}
