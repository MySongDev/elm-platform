import { pickRandom, randomCword, randomInt } from './mock-utils.js'

const DISTRICTS = [
  {
    name: '黄浦区',
    latRange: [31.22, 31.24],
    lngRange: [121.46, 121.49],
  },
  {
    name: '徐汇区',
    latRange: [31.17, 31.20],
    lngRange: [121.42, 121.46],
  },
  {
    name: '长宁区',
    latRange: [31.20, 31.23],
    lngRange: [121.38, 121.42],
  },
  {
    name: '浦东新区',
    latRange: [31.13, 31.25],
    lngRange: [121.50, 121.70],
  },
]

const ROAD_SUFFIXES = ['路', '街', '大道', '弄', '巷']
const ROAD_NAMES = ['南京', '淮海', '人民', '中山', '四川', '长宁', '世纪', '张杨', '金沙江', '真北']
const PLACE_TYPES = ['广场', '购物中心', '小区', '写字楼', '美食城', '地铁站']

function randomInRange(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(5)
}

function pickDistrict() {
  return pickRandom(DISTRICTS)
}

function generateCoords(district) {
  const latitude = randomInRange(district.latRange[0], district.latRange[1])
  const longitude = randomInRange(district.lngRange[0], district.lngRange[1])

  return {
    geohash: `${latitude},${longitude}`,
    latitude,
    longitude,
  }
}

function generateAddress(district) {
  const road = `${pickRandom(ROAD_NAMES)}${pickRandom(ROAD_SUFFIXES)}`
  return `上海市${district.name}${road}${randomInt(1, 3000)}号`
}

function generatePlaceName(keyword, index) {
  if (index === 0) {
    return keyword
  }

  return `${keyword}${randomCword(2, 3)}${pickRandom(PLACE_TYPES)}`
}

function generatePoi(keyword, index) {
  const district = pickDistrict()

  return {
    address: generateAddress(district),
    name: generatePlaceName(keyword, index),
    ...generateCoords(district),
  }
}

function generatePoiList(keyword, count) {
  const results = []
  const usedNames = new Set()

  for (let index = 0; index < count; index += 1) {
    let poi = generatePoi(keyword, index)
    let attempts = 0

    while (usedNames.has(poi.name) && attempts < 5) {
      poi = generatePoi(keyword, index)
      attempts += 1
    }

    usedNames.add(poi.name)
    results.push(poi)
  }

  return results
}

export default [
  {
    url: '/v1/pois',
    method: 'get',
    response: ({ query }) => {
      const { keyword } = query

      if (!keyword || !keyword.trim()) {
        return []
      }

      const trimmed = keyword.trim()

      if (trimmed === '空' || trimmed === 'empty') {
        return []
      }

      const count = trimmed.length === 1
        ? randomInt(6, 10)
        : trimmed.length <= 3
          ? randomInt(4, 8)
          : randomInt(1, 4)

      return generatePoiList(trimmed, count)
    },
  },
]
