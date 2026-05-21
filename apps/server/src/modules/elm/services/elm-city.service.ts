import { Injectable, NotFoundException } from '@nestjs/common';
import { createEntry, createRestaurantCategory } from '../factories/elm.factories';
import type { CityRecord } from '../types/elm.types';
import { parseGeoHash } from '../utils/elm-query';
import { ElmStoreService } from './elm-store.service';

@Injectable()
export class ElmCityService {
  constructor(private readonly store: ElmStoreService) {}

  getCities(type: string) {
    if (type === 'guess') {
      return this.store.cities[0];
    }

    if (type === 'hot') {
      return this.store.cities.slice(0, 4);
    }

    return this.store.cities.reduce<Record<string, CityRecord[]>>((groups, city) => {
      const key = city.pinyin.charAt(0).toUpperCase();
      groups[key] = groups[key] || [];
      groups[key].push(city);
      return groups;
    }, {});
  }

  getCity(id: number) {
    const city = this.store.cities.find((item) => item.id === id);
    if (!city) throw new NotFoundException('城市不存在');
    return city;
  }

  searchPois(cityId: number, keyword: string) {
    const city = this.store.cities.find((item) => item.id === cityId) || this.store.cities[0];
    const safeKeyword = keyword || city.name;

    return Array.from({ length: 6 }, (_, index) => {
      const latitude = Number((city.latitude + index * 0.006).toFixed(5));
      const longitude = Number((city.longitude + index * 0.006).toFixed(5));
      return {
        name: `${safeKeyword}${index === 0 ? '' : index + 1}号店`,
        address: `${city.name}市中心商圈 ${index + 1} 号`,
        latitude,
        longitude,
        geohash: `${latitude},${longitude}`,
      };
    });
  }

  getPoi(geohash?: string, latitude?: number, longitude?: number) {
    const [lat, lng] = parseGeoHash(geohash, latitude, longitude);

    return {
      address: '上海市黄浦区西藏中路',
      city: '上海市',
      geohash: `${lat},${lng}`,
      latitude: String(lat),
      longitude: String(lng),
      name: '黄浦区上海人民广场',
    };
  }

  getIndexEntries() {
    return [
      createEntry(1, '甜品饮品', '幸福甜味，准时送达', 'a867c870b22bc74c87c348b75528djpeg.jpeg', 248),
      createEntry(2, '鲜花蛋糕', '鲜花、蛋糕与礼物', '3edf3f4ef8ed1d300896c5b9178685ebpng.png', 248),
      createEntry(3, '品牌快餐', '大牌快餐放心点', 'd7c5f78d73756cfc7b5276f8ae901jpeg.jpeg', 1),
      createEntry(4, '轻食简餐', '沙拉、轻食、健康餐', 'b7ba9547aa700bd20d0420e1794a8jpeg.jpeg', 2),
      createEntry(5, '夜宵', '深夜也有热乎饭', 'b02bd836411c016935d258b300cfejpeg.jpeg', 3),
      createEntry(6, '水果', '新鲜水果现切', '428d07ca24875e9e35723c8570c32jpeg.jpeg', 4),
      createEntry(7, '超市便利', '日用百货及时送', '0e07558e305abfb2618ae760142222f9png.png', 5),
      createEntry(8, '医药健康', '常备药品送到家', '512232422a83e25a2c0a5588b7b6e730png.png', 6),
    ];
  }

  getRestaurantCategories() {
    return [
      createRestaurantCategory(248, '鲜花蛋糕', ['全部鲜花蛋糕', '鲜花', '蛋糕', '面包']),
      createRestaurantCategory(1, '快餐便当', ['全部快餐便当', '简餐', '汉堡', '炸鸡']),
      createRestaurantCategory(2, '轻食简餐', ['全部轻食简餐', '沙拉', '健身餐', '果汁']),
      createRestaurantCategory(3, '夜宵', ['全部夜宵', '烧烤', '炸串', '小龙虾']),
    ];
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
    ];
  }

  getActivityAttributes() {
    return [
      { description: '可使用在线支付', icon_color: 'FF4E00', icon_name: '付', id: 3, name: '在线支付', ranking_weight: 2, __v: 0 },
      { description: '该商家支持开发票', icon_color: '999999', icon_name: '票', id: 4, name: '开发票', ranking_weight: 3, __v: 0 },
      { description: '新店开业优惠', icon_color: '70BC46', icon_name: '新', id: 5, name: '新店', ranking_weight: 4, __v: 0 },
    ];
  }
}
