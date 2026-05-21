import {
  CityRecord,
  FoodRecord,
  RestaurantRecord,
  RestaurantSeedInput,
} from '../types/elm.types';

export const nowIso = () => new Date().toISOString();

export function createCity(
  id: number,
  name: string,
  abbr: string,
  areaCode: string,
  latitude: number,
  longitude: number,
  pinyin: string,
  sort: number,
): CityRecord {
  return {
    id,
    name,
    abbr,
    area_code: areaCode,
    sort,
    latitude,
    longitude,
    geohash: `${latitude},${longitude}`,
    is_map: true,
    pinyin,
  };
}

export function createRestaurant(data: RestaurantSeedInput): RestaurantRecord {
  const deliveryFee = 5;

  return {
    ...data,
    location: [data.longitude, data.latitude],
    supports: [
      {
        description: '该商家支持在线支付',
        icon_color: 'FF4E00',
        icon_name: '付',
        id: 3,
        name: '在线支付',
        _id: `support-${data.id}-pay`,
      },
      {
        description: '准时必达，超时秒赔',
        icon_color: '57A9FF',
        icon_name: '准',
        id: 9,
        name: '准时达',
        _id: `support-${data.id}-time`,
      },
    ],
    status: 1,
    rating_count: 389,
    promotion_info: '欢迎光临，本店支持本地后端联调。',
    piecewise_agent_fee: { tips: `配送费约¥${deliveryFee}` },
    opening_hours: ['8:30/22:30'],
    license: {
      catering_service_license_image: '',
      business_license_image: '',
    },
    is_new: data.id > 2,
    is_premium: true,
    identification: {
      registered_number: '',
      registered_address: '',
      operation_period: '',
      licenses_scope: '',
      licenses_number: '',
      licenses_date: '',
      legal_person: '',
      identificate_date: null,
      identificate_agency: '',
      company_name: '',
    },
    float_minimum_order_amount: 20,
    float_delivery_fee: deliveryFee,
    delivery_mode: {
      color: '57A9FF',
      id: 1,
      is_solid: true,
      text: '蜂鸟专送',
    },
    activities: [
      {
        icon_name: '减',
        name: '满减优惠',
        description: '满30减5，满60减8',
        icon_color: 'f07373',
        id: 1,
        _id: `activity-${data.id}-discount`,
      },
      {
        icon_name: '特',
        name: '优惠大酬宾',
        description: '本地联调专享优惠',
        icon_color: 'EDC123',
        id: 2,
        _id: `activity-${data.id}-special`,
      },
    ],
    createdAt: nowIso(),
  };
}

export function createFood(
  restaurantId: number,
  categoryId: number,
  itemId: number,
  name: string,
  price: number,
  imagePath: string,
  description: string,
): FoodRecord {
  const monthSales = 120 + itemId * 8;

  return {
    _id: `food-${itemId}`,
    item_id: itemId,
    category_id: categoryId,
    restaurant_id: restaurantId,
    name,
    image_path: imagePath,
    description,
    tips: `月售${monthSales}份 好评率96%`,
    month_sales: monthSales,
    satisfy_rate: 96,
    satisfy_count: 803,
    rating_count: 880,
    rating: 4.6,
    activity: {
      image_text_color: 'f1884f',
      icon_color: 'f07373',
      image_text: '招牌',
    },
    attributes: [{ icon_color: '5ec452', icon_name: '新' }],
    specifications: [],
    specfoods: [
      {
        specs_name: '默认',
        name,
        item_id: itemId,
        sku_id: itemId,
        food_id: itemId,
        restaurant_id: restaurantId,
        _id: `spec-${itemId}`,
        specs: [],
        stock: 1000,
        checkout_mode: 1,
        is_essential: false,
        recent_popularity: monthSales,
        sold_out: false,
        price,
        promotion_stock: -1,
        recent_rating: 4.6,
        packing_fee: 1,
        pinyin_name: '',
        original_price: 0,
      },
    ],
    createdAt: nowIso(),
  };
}

export function createEntry(
  id: number,
  title: string,
  description: string,
  imageUrl: string,
  categoryId: number,
) {
  const filterKey = encodeURIComponent(JSON.stringify({
    restaurant_category_id: { id: categoryId, name: title },
  }));

  return {
    id,
    is_in_serving: true,
    description,
    title,
    link: `https://h5.ele.me/msite/food/#geohash=31.22967,121.4762&target_name=${encodeURIComponent(title)}&filter_key=${filterKey}`,
    image_url: `/${imageUrl}`,
    icon_url: '',
    title_color: '',
    __v: 0,
  };
}

export function createRestaurantCategory(id: number, name: string, subNames: string[]) {
  return {
    count: 3,
    id,
    image_url: '0e07558e305abfb2618ae760142222f9png',
    level: 1,
    name,
    sub_categories: subNames.map((subName, index) => ({
      count: 3 + index,
      id: id + index,
      image_url: '3edf3f4ef8ed1d300896c5b9178685ebpng',
      level: index === 0 ? 1 : 2,
      name: subName,
      _id: `category-${id}-${index}`,
    })),
  };
}
