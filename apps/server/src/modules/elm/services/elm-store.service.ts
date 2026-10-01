import { Injectable } from '@nestjs/common'
import {
  seedCities,
  seedOrders,
} from '../data/elm.seed'

/**
 * 内存数据源 —— 2026-09-30 商家数据本地化后只剩**尚未建表**的两块。
 *
 * 原本这里还有 `restaurants` / `menuCategories` / `foods` 三个数组，它们是「商家数据三源分裂」
 * 的一源（用户端看上游、管理端看内存、下单落真库，三者互不相通）。现在这三块已有真库表
 * `restaurants` / `food_categories` / `foods`，从上游导入并由服务层直接读写，
 * 不再经过这里。详见 docs/engineering/008-merchant-data-localization.md。
 */
@Injectable()
export class ElmStoreService {
  readonly cities = [...seedCities]
  readonly orders = [...seedOrders]
}
