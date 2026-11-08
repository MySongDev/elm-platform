import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { toCategoryEntryResponse } from '../assemblers/elm.assemblers'
import { createRestaurantCategory } from '../factories/elm.factories'

/** 首页/点菜页的静态与半静态元数据，数据源是 `category_entries` 表与本地工厂。 */
@Injectable()
export class ElmHomeMetaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `/v2/index_entry`：首页分类入口。
   *
   * ⚠️ 必须显式 `orderBy: sortOrder`：数据库不保证 findMany 的返回顺序，
   * 而排序信息在上游是靠数组下标表达的，漏了这句首页分类会随机排列。
   */
  async listCategoryEntries() {
    const rows = await this.prisma.categoryEntry.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map(toCategoryEntryResponse)
  }

  getRestaurantCategories() {
    return [
      createRestaurantCategory(248, '鲜花蛋糕', ['全部鲜花蛋糕', '鲜花', '蛋糕', '面包']),
      createRestaurantCategory(1, '快餐便当', ['全部快餐便当', '简餐', '汉堡', '炸鸡']),
      createRestaurantCategory(2, '轻食简餐', ['全部轻食简餐', '沙拉', '健身餐', '果汁']),
      createRestaurantCategory(3, '夜宵', ['全部夜宵', '烧烤', '炸串', '小龙虾']),
    ]
  }

  getDeliveryModes() {
    return [
      {
        color: '57A9FF',
        id: 1,
        is_solid: true,
        text: '蜂鸟专送',
        __v: 0,
      },
    ]
  }

  getActivityAttributes() {
    return [
      {
        description: '可使用在线支付',
        icon_color: 'FF4E00',
        icon_name: '付',
        id: 3,
        name: '在线支付',
        ranking_weight: 2,
        __v: 0,
      },
      {
        description: '该商家支持开发票',
        icon_color: '999999',
        icon_name: '票',
        id: 4,
        name: '开发票',
        ranking_weight: 3,
        __v: 0,
      },
      {
        description: '新店开业优惠',
        icon_color: '70BC46',
        icon_name: '新',
        id: 5,
        name: '新店',
        ranking_weight: 4,
        __v: 0,
      },
    ]
  }
}
