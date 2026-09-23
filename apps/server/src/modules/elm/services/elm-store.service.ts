import { Injectable } from '@nestjs/common'
import {
  seedCities,
  seedFoods,
  seedMenuCategories,
  seedOrders,
  seedRestaurants,
} from '../data/elm.seed'

@Injectable()
export class ElmStoreService {
  // 临时内存数据源：后续接 Prisma/数据库时，优先替换这里，领域服务尽量不动。
  readonly cities = [...seedCities]
  readonly restaurants = [...seedRestaurants]
  readonly menuCategories = [...seedMenuCategories]
  readonly foods = [...seedFoods]
  readonly orders = [...seedOrders]
}
