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
  // 新增：新地址可勾「设为默认」，true 时 create 顶替该用户旧默认（唯一不变式）
  isDefault?: boolean
}

// 更新入参：列与 create 完全一致（编辑态整表单全量回写），单独命名是为了
// 在 service 里区分「新建」与「改一条」两种意图；isDefault 传 true 时顶替旧默认。
export type CustomerAddressUpdateInput = CustomerAddressCreateInput
