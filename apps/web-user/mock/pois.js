// mock/pois.js - 搜索地址 Mock（动态生成）
import Mock from 'mockjs'

const { Random } = Mock

// ===== 基础数据池 =====

const DISTRICTS = [
  { name: '黄浦区', latRange: [31.22, 31.24], lngRange: [121.46, 121.49] },
  { name: '徐汇区', latRange: [31.17, 31.20], lngRange: [121.42, 121.46] },
  { name: '长宁区', latRange: [31.20, 31.23], lngRange: [121.38, 121.42] },
  { name: '静安区', latRange: [31.23, 31.26], lngRange: [121.43, 121.46] },
  { name: '普陀区', latRange: [31.23, 31.27], lngRange: [121.38, 121.43] },
  { name: '虹口区', latRange: [31.25, 31.28], lngRange: [121.47, 121.51] },
  { name: '杨浦区', latRange: [31.27, 31.31], lngRange: [121.50, 121.55] },
  { name: '浦东新区', latRange: [31.13, 31.25], lngRange: [121.50, 121.70] },
  { name: '闵行区', latRange: [31.08, 31.18], lngRange: [121.33, 121.47] },
  { name: '宝山区', latRange: [31.30, 31.40], lngRange: [121.40, 121.50] },
]

const ROAD_SUFFIXES = ['路', '街', '大道', '弄', '巷']

const PLACE_TYPES = {
  mall: ['广场', '购物中心', '商场', '百货', '商业中心'],
  community: ['小区', '花园', '公寓', '新村', '苑'],
  building: ['大厦', '中心', '大楼', '写字楼', '国际'],
  food: ['美食城', '餐饮街', '小吃街', '夜市'],
  landmark: ['公园', '地铁站', '医院', '学校', '体育馆'],
}

const ROAD_NAMES = [
  '南京东',
  '南京西',
  '淮海中',
  '延安中',
  '人民',
  '中山北',
  '中山南',
  '四川北',
  '西藏中',
  '漕溪北',
  '肇嘉浜',
  '长宁',
  '虹桥',
  '世纪大',
  '浦东南',
  '张杨',
  '陆家嘴',
  '金沙江',
  '武宁',
  '曹杨',
  '真北',
]

// ===== 工具函数 =====

function randomInRange(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(5)
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickDistrict() {
  return pickRandom(DISTRICTS)
}

function generateCoords(district) {
  const lat = randomInRange(district.latRange[0], district.latRange[1])
  const lng = randomInRange(district.lngRange[0], district.lngRange[1])
  return { latitude: lat, longitude: lng, geohash: `${lat},${lng}` }
}

function generateAddress(district) {
  const road = pickRandom(ROAD_NAMES) + pickRandom(ROAD_SUFFIXES)
  const number = Random.natural(1, 3000)
  return `上海市${district.name}${road}${number}号`
}

function generatePlaceName(keyword, index) {
  const district = pickDistrict()
  const placeType = pickRandom(Object.keys(PLACE_TYPES))
  const suffix = pickRandom(PLACE_TYPES[placeType])

  const patterns = [
    () => `${keyword}(${district.name.replace('区', '')}${suffix})`,
    () => `${keyword} ${pickRandom(ROAD_NAMES)}${suffix}店`,
    () => `${keyword}(${Random.cword(2)}${suffix})`,
    () => `${keyword}·${Random.cword(2, 3)}店`,
  ]

  if (index === 0)
    return keyword
  return pickRandom(patterns)()
}

// ===== POI 生成器 =====

function generatePoi(keyword, index) {
  const district = pickDistrict()
  const coords = generateCoords(district)
  const address = generateAddress(district)
  const name = generatePlaceName(keyword, index)

  return { name, address, ...coords }
}

function generatePoiList(keyword, count) {
  const results = []
  const usedNames = new Set()

  for (let i = 0; i < count; i++) {
    let poi = generatePoi(keyword, i)
    let attempts = 0

    while (usedNames.has(poi.name) && attempts < 5) {
      poi = generatePoi(keyword, i)
      attempts++
    }

    usedNames.add(poi.name)
    results.push(poi)
  }

  return results
}

// ===== Mock 接口 =====

export default [
  {
    url: '/v1/pois',
    method: 'get',
    response: ({ query }) => {
      const { city_id, keyword, type = 'search' } = query

      if (!keyword || !keyword.trim()) {
        return []
      }

      const trimmed = keyword.trim()
      const len = trimmed.length

      // 模拟空结果（极短或特殊关键词）
      if (trimmed === '空' || trimmed === 'empty') {
        return []
      }

      // 根据关键词长度动态决定结果数量（模拟真实搜索行为）
      let count
      if (len === 1) {
        count = Random.natural(6, 10)
      }
      else if (len <= 3) {
        count = Random.natural(4, 8)
      }
      else {
        count = Random.natural(1, 4)
      }

      return generatePoiList(trimmed, count)
    },
  },
]
