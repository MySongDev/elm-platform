import { pickRandom, randomBoolean, randomCname, randomCsentence, randomDate, randomImage, randomInt, shuffle } from './mock-utils.js'

const REVIEW_TAGS = [
  {
    name: '全部',
    unsatisfied: false,
  },
  {
    name: '满意',
    unsatisfied: false,
  },
  {
    name: '不满意',
    unsatisfied: true,
  },
  {
    name: '有图',
    unsatisfied: false,
  },
  {
    name: '味道好',
    unsatisfied: false,
  },
  {
    name: '送货快',
    unsatisfied: false,
  },
  {
    name: '分量足',
    unsatisfied: false,
  },
  {
    name: '包装精美',
    unsatisfied: false,
  },
]

const TAG_NAMES = REVIEW_TAGS.map(item => item.name)
const memberLabels = {
  black: '黑金会员',
  gold: '黄金会员',
  silver: '白银会员',
}

function randomReviewTags() {
  const count = randomInt(1, 4)
  const tags = shuffle(TAG_NAMES.filter(name => name !== '全部')).slice(0, count)
  return ['全部', ...tags]
}

function createReview(id) {
  const type = pickRandom(['gold', 'black', 'silver'])

  return {
    avatar: randomImage('100x100', 'user'),
    content: randomBoolean(85, 15) ? randomCsentence(10, 30) : '',
    date: randomDate(),
    id,
    images: randomBoolean(25, 75) ? [randomImage('160x160', 'food')] : [],
    memberBadge: {
      label: memberLabels[type],
      type,
    },
    nickname: randomCname(),
    packageStar: randomInt(3, 5),
    productStar: randomInt(3, 5),
    purchaseTimes: randomInt(1, 8),
    relatedProduct: pickRandom(['经典提拉米苏', '意式肉酱面', '草莓蛋糕', '芒果奶冻']),
    reply: randomBoolean() ? randomCsentence(8, 20) : null,
    source: pickRandom(['外卖', '到店', '']),
    tags: randomReviewTags(),
    usefulCount: randomInt(0, 25),
  }
}

const reviews = Array.from({ length: 24 }, (_, index) => createReview(index + 1))

function getPagedReviews(query = {}) {
  const offset = Number(query.offset ?? 0)
  const limit = Number(query.limit ?? 30)

  if (query.empty === 'true')
    return []

  return reviews.slice(offset, offset + limit)
}

function getReviewTags() {
  return REVIEW_TAGS.map((item, index) => ({
    ...item,
    _id: `mock-review-tag-${index}`,
    count: index === 0 ? reviews.length : randomInt(1, reviews.length),
  }))
}

const ratingRoutes = [
  '/api/ugc/v2/restaurants/:restaurant_id/ratings',
  '/ugc/v2/restaurants/:restaurant_id/ratings',
]

const tagRoutes = [
  '/api/ugc/v2/restaurants/:restaurant_id/ratings/tags',
  '/ugc/v2/restaurants/:restaurant_id/ratings/tags',
]

export default [
  ...ratingRoutes.map(url => ({
    url,
    method: 'get',
    response: ({ query }) => getPagedReviews(query),
  })),
  ...tagRoutes.map(url => ({
    url,
    method: 'get',
    response: getReviewTags,
  })),
]
