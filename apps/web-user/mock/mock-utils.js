const CJK_CHARS = '一二三四五六七八九十春夏秋冬东南西北美味鲜香甜辣饭面店铺城市花园中心'
const SURNAMES = ['张', '李', '王', '赵', '陈', '刘', '杨', '黄']
const GIVEN_NAMES = ['明', '华', '芳', '娜', '强', '磊', '敏', '杰']

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min, max, digits = 1) {
  return Number((min + Math.random() * (max - min)).toFixed(digits))
}

export function randomBoolean(trueWeight = 1, falseWeight = 1) {
  return Math.random() < trueWeight / (trueWeight + falseWeight)
}

export function pickRandom(items) {
  return items[randomInt(0, items.length - 1)]
}

export function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

export function randomString(length, alphabet = 'abcdefghijklmnopqrstuvwxyz') {
  const chars = alphabet.split('')
  let value = ''

  for (let index = 0; index < length; index += 1) {
    value += pickRandom(chars)
  }

  return value
}

export function randomCword(min = 2, max = min) {
  const length = randomInt(min, max)
  const chars = CJK_CHARS.split('')
  let value = ''

  for (let index = 0; index < length; index += 1) {
    value += pickRandom(chars)
  }

  return value
}

export function randomCsentence(min = 8, max = 20) {
  return `${randomCword(min, max)}。`
}

export function randomCname() {
  return `${pickRandom(SURNAMES)}${pickRandom(GIVEN_NAMES)}${randomBoolean() ? pickRandom(GIVEN_NAMES) : ''}`
}

export function randomDate() {
  const month = String(randomInt(1, 12)).padStart(2, '0')
  const day = String(randomInt(1, 28)).padStart(2, '0')
  return `2026.${month}.${day}`
}

export function randomImage(size = '160x160', label = 'food') {
  return `https://dummyimage.com/${size}/f5f5f5/999&text=${encodeURIComponent(label)}`
}
