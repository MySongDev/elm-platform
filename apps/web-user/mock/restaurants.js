import Mock from 'mockjs'
// 定义所有可能的支持项（可以从实际接口数据复制）
const supportPool = [
  {
    description: '已加入“外卖保”计划，食品安全有保障',
    icon_color: '999999',
    icon_name: '保',
    id: 7,
    name: '外卖保',
    _id: '591bec73c2bbc84a6328a1e5',
  },
  {
    description: '准时必达，超时秒赔',
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
  // 可以继续添加更多支持项...
]

/**
 * 随机生成 supports 数组
 * @param {number} min - 最小数量（默认0）
 * @param {number} max - 最大数量（默认支持项池长度）
 * @returns {Array} 随机选取的支持项列表（不重复）
 */
function generateRandomSupports(min = 0, max = supportPool.length) {
  // 随机决定本次要选取的数量
  const count = Math.floor(Math.random() * (max - min + 1)) + min

  // 打乱数组并取前 count 项（确保不重复）
  const shuffled = [...supportPool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
// 生成随机店铺数据
function generateRestaurants(count = 10) {
  return Mock.mock({
    [`list|${count}`]: [
      {
        'id|+1': 1,
        'name': '@ctitle(3,8)',
        'address': '@county(true) @street @cword(5,10)号',
        'latitude': '@float(30.5, 31.5, 5, 5)',
        'longitude': '@float(121.2, 121.6, 5, 5)',
        'location': [121.50146, 31.38098],
        'phone': /^1[3-9]\d{9}$/,
        'category': '@pick(["快餐便当/简餐", "川湘菜", "日韩料理", "西餐", "小吃夜宵"])',
        'supports': generateRandomSupports(1, 3), // 随机出现 1~2 项,
        'status|0-1': 0,
        'recent_order_num|100-1000': 615,
        'rating_count|100-500': 389,
        'rating|1-5.1': 4.3,
        'promotion_info': '@csentence(10,30)',
        'piecewise_agent_fee': {
          tips: '配送费约¥5',
        },
        'opening_hours': ['8:30/20:30'],
        'license': {
          catering_service_license_image: '',
          business_license_image: '',
        },
        'is_new|1': true,
        'is_premium|1': true,
        'image_path': `/img/shop/${Mock.Random.string('lower', 15)}.jpg`,
        'identification': {
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
        'float_minimum_order_amount|20-50': 20,
        'float_delivery_fee|0-9': 5,
        'distance': '@float(1, 30, 1, 1)公里',
        'order_lead_time': '@integer(20, 60)分钟',
        'description': '@csentence(5,15)',
        'delivery_mode': {
          color: '57A9FF',
          id: 1,
          is_solid: true,
          text: '蜂鸟专送',
        },
        'activities': [
          {
            icon_name: '减',
            name: '满减优惠',
            description: '满30减5，满60减8',
            icon_color: 'f07373',
            id: 1,
            _id: '591bec73c2bbc84a6328a1e7',
          },
          {
            icon_name: '特',
            name: '优惠大酬宾',
            description: '@csentence(5,15)',
            icon_color: 'EDC123',
            id: 2,
            _id: '591bec73c2bbc84a6328a1e6',
          },
        ],
      },
    ],
  }).list
}

// 针对特定关键词的搜索模拟
export function searchRestaurants(geohash, keyword) {
  console.log(`[Mock] 搜索: geohash=${geohash}, keyword=${keyword}`)

  if (keyword.includes('肯德基')) {
    return [
      // {
      //   id: 1,
      //   name: '肯德基',
      //   address: '上海市宝山区淞宝路155弄18号星月国际商务广场1层',
      //   latitude: 31.38098,
      //   longitude: 121.50146,
      //   location: [121.50146, 31.38098],
      //   phone: '1232313124324',
      //   category: '快餐便当/简餐',
      //   supports: generateRandomSupports(1, 3),
      //   status: 0,
      //   recent_order_num: 615,
      //   rating_count: 389,
      //   rating: 1.6,
      //   promotion_info: '他依然有人有人有人有人有人',
      //   piecewise_agent_fee: { tips: '配送费约¥5' },
      //   opening_hours: ['8:30/20:30'],
      //   license: { catering_service_license_image: '', business_license_image: '' },
      //   is_new: true,
      //   is_premium: true,
      //   image_path: '/img/shop/15c1513a00615.jpg',
      //   identification: {
      //     registered_number: '',
      //     registered_address: '',
      //     operation_period: '',
      //     licenses_scope: '',
      //     licenses_number: '',
      //     licenses_date: '',
      //     legal_person: '',
      //     identificate_date: null,
      //     identificate_agency: '',
      //     company_name: '',
      //   },
      //   float_minimum_order_amount: 20,
      //   float_delivery_fee: 5,
      //   distance: '19.5公里',
      //   order_lead_time: '40分钟',
      //   description: '好吃的',
      //   delivery_mode: {
      //     color: '57A9FF',
      //     id: 1,
      //     is_solid: true,
      //     text: '蜂鸟专送',
      //   },
      //   activities: [
      //     {
      //       icon_name: '减',
      //       name: '满减优惠',
      //       description: '满30减5，满60减8',
      //       icon_color: 'f07373',
      //       id: 1,
      //       _id: '591bec73c2bbc84a6328a1e7',
      //     },
      //   ],
      // },
      generateRestaurants(4),
    ]
  }

  if (keyword.includes('麦当劳')) {
    return generateRestaurants(4).map(item => ({
      ...item,
      name: `麦当劳 ${item.name}`,
      category: '快餐便当/简餐',
    }))
  }

  if (keyword.includes('测试空')) {
    return []
  }

  // 默认返回随机数据
  return generateRestaurants(8)
}
