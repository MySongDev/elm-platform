import { pickRandom, randomBoolean, randomCsentence, randomCword, randomFloat, randomInt, randomString } from './mock-utils.js'

const supportPool = [
  {
    description: '食品安全有保障',
    icon_color: '999999',
    icon_name: '保',
    id: 7,
    name: '外卖保',
    _id: '591bec73c2bbc84a6328a1e5',
  },
  {
    description: '准时必达',
    icon_color: '57A9FF',
    icon_name: '准',
    id: 9,
    name: '准时达',
    _id: '591bec73c2bbc84a6328a1e4',
  },
  {
    description: '该商家提供发票',
    icon_color: 'FF6B6B',
    icon_name: '票',
    id: 8,
    name: '开发票',
    _id: '591bec73c2bbc84a6328a1e3',
  },
]

function generateRandomSupports(min = 0, max = supportPool.length) {
  const count = randomInt(min, max)
  return [...supportPool].sort(() => Math.random() - 0.5).slice(0, count)
}

function createRestaurant(id) {
  const categories = ['快餐便当', '川湘菜', '日韩料理', '西餐', '小吃夜宵']

  return {
    id,
    name: `${randomCword(3, 8)}餐厅`,
    address: `上海市${randomCword(2, 3)}区${randomCword(3, 6)}路${randomInt(1, 999)}号`,
    latitude: randomFloat(30.5, 31.5, 5),
    longitude: randomFloat(121.2, 121.6, 5),
    location: [121.50146, 31.38098],
    phone: `1${randomInt(3, 9)}${randomString(9, '0123456789')}`,
    category: pickRandom(categories),
    supports: generateRandomSupports(1, 3),
    status: randomInt(0, 1),
    recent_order_num: randomInt(100, 1000),
    rating_count: randomInt(100, 500),
    rating: randomFloat(1, 5, 1),
    promotion_info: randomCsentence(10, 30),
    piecewise_agent_fee: {
      tips: '配送费约5元',
    },
    opening_hours: ['8:30/20:30'],
    license: {
      catering_service_license_image: '',
      business_license_image: '',
    },
    is_new: randomBoolean(),
    is_premium: randomBoolean(),
    image_path: `/img/shop/${randomString(15)}.jpg`,
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
    float_minimum_order_amount: randomInt(20, 50),
    float_delivery_fee: randomInt(0, 9),
    distance: `${randomFloat(1, 30, 1)}公里`,
    order_lead_time: `${randomInt(20, 60)}分钟`,
    description: randomCsentence(5, 15),
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
        description: '满30减5，满60减10',
        icon_color: 'f07373',
        id: 1,
        _id: '591bec73c2bbc84a6328a1e7',
      },
      {
        icon_name: '特',
        name: '优惠大酬宾',
        description: randomCsentence(5, 15),
        icon_color: 'EDC123',
        id: 2,
        _id: '591bec73c2bbc84a6328a1e6',
      },
    ],
  }
}

function generateRestaurants(count = 10) {
  return Array.from({ length: count }, (_, index) => createRestaurant(index + 1))
}

export function searchRestaurants(geohash, keyword = '') {
  console.log(`[Mock] search: geohash=${geohash}, keyword=${keyword}`)

  if (keyword.includes('测试空') || keyword.includes('empty')) {
    return []
  }

  if (keyword.includes('麦当劳')) {
    return generateRestaurants(4).map(item => ({
      ...item,
      name: `麦当劳${item.name}`,
      category: '快餐便当',
    }))
  }

  return generateRestaurants(8)
}
