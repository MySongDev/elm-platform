import type { AddressRecord, ElmUserRecord } from '../types/elm.types'
import { Injectable } from '@nestjs/common'
import { nextNumberId, toNumberValue, toStringValue } from '../utils/elm-query'
import { ElmStoreService } from './elm-store.service'

@Injectable()
export class ElmUserCompatService {
  constructor(private readonly store: ElmStoreService) {}

  createCaptcha() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="36"><rect width="90" height="36" fill="#f2f6ff"/><text x="14" y="24" font-size="20" font-family="Arial" fill="#3190e8">1234</text></svg>`
    return {
      status: 1,
      code: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    }
  }

  login(body: Record<string, unknown>) {
    const username = toStringValue(body.username || body.user_name || body.mobile, 'elm_user')
    let user = this.store.users.find(item => item.username === username || item.mobile === username)

    if (!user) {
      user = this.createUser(username)
      this.store.users.push(user)
    }

    return {
      ...user,
      status: 1,
      success: '登录成功',
    }
  }

  getUserInfo(userId?: number) {
    return this.store.users.find(item => item.user_id === userId) || this.store.users[0]
  }

  changePassword() {
    return {
      status: 1,
      success: '密码修改成功',
    }
  }

  signout() {
    return {
      status: 1,
      success: '退出成功',
    }
  }

  listAddresses(userId: number) {
    return this.store.addresses.filter(item => item.user_id === userId)
  }

  addAddress(userId: number, body: Record<string, unknown>) {
    const address: AddressRecord = {
      id: Date.now(),
      user_id: userId,
      name: toStringValue(body.name, '收货人'),
      phone: toStringValue(body.phone, ''),
      phone_bk: toStringValue(body.phone_bk, ''),
      address: toStringValue(body.address, ''),
      address_detail: toStringValue(body.address_detail, ''),
      geohash: toStringValue(body.geohash, '31.22967,121.4762'),
      sex: toNumberValue(body.sex, 1),
      tag: toStringValue(body.tag, '家'),
      tag_type: toNumberValue(body.tag_type, 2),
      poi_type: toNumberValue(body.poi_type, 0),
    }

    this.store.addresses.push(address)
    return address
  }

  deleteAddress(userId: number, addressId: number) {
    const addressIndex = this.store.addresses.findIndex(
      item => item.user_id === userId && item.id === addressId,
    )
    if (addressIndex >= 0) {
      this.store.addresses.splice(addressIndex, 1)
    }

    return {
      status: 1,
      success: '删除地址成功',
    }
  }

  uploadAvatar(userId: number) {
    const user = this.store.users.find(item => item.user_id === userId)
    const imagePath = 'default.jpg'
    if (user)
      user.avatar = imagePath
    return {
      status: 1,
      image_path: imagePath,
    }
  }

  private createUser(username: string): ElmUserRecord {
    const id = nextNumberId(this.store.users.map(item => item.user_id))
    return {
      user_id: id,
      id,
      username,
      mobile: /^1\d{10}$/.test(username) ? username : '',
      email: username.includes('@') ? username : '',
      avatar: 'default.jpg',
      balance: 0,
      gift_amount: 0,
      point: 0,
      city: '上海',
      registe_time: '2026-05-17 12:00',
      is_active: 1,
    }
  }
}
