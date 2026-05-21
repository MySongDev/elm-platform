import Mock from 'mockjs'

const REVIEW_TAGS = [
  { name: '全部', unsatisfied: false },
  { name: '满意', unsatisfied: false },
  { name: '不满意', unsatisfied: true },
  { name: '有图', unsatisfied: false },
  { name: '味道好', unsatisfied: false },
  { name: '送货快', unsatisfied: false },
  { name: '分量足', unsatisfied: false },
  { name: '包装精美', unsatisfied: false },
  { name: '干净卫生', unsatisfied: false },
  { name: '食材新鲜', unsatisfied: false },
  { name: '服务不错', unsatisfied: false },
]

const TAG_NAMES = REVIEW_TAGS.map(item => item.name)

Mock.Random.extend({
  reviewTags() {
    const count = Mock.Random.integer(1, 4)
    const tags = Mock.Random.shuffle(TAG_NAMES.filter(name => name !== '全部')).slice(0, count)
    return ['全部', ...tags]
  },
})

const reviews = Mock.mock({
  'list|24': [{
    'id|+1': 1,
    'nickname': '@cname',
    'avatar': '@image("100x100", "#f0f0f0", "@cname")',
    memberBadge() {
      const types = ['gold', 'black', 'silver']
      const labels = { gold: '黄金会员', black: '黑金会员', silver: '白银会员' }
      const type = Mock.Random.pick(types)
      return { type, label: labels[type] }
    },
    'productStar|3-5': 5,
    'packageStar|3-5': 5,
    'date': '@date("yyyy.MM.dd")',
    content() {
      return Mock.Random.boolean(85, 15, true) ? Mock.Random.csentence(10, 30) : ''
    },
    relatedProduct() {
      return Mock.Random.pick(['经典提拉米苏', '意式肉酱面', '草莓蛋糕', '芒果奶冻'])
    },
    'usefulCount|0-25': 0,
    reply() {
      return Mock.Random.boolean() ? Mock.Random.csentence(8, 20) : null
    },
    images() {
      return Mock.Random.boolean(25, 75, true)
        ? [Mock.Random.image('160x160', '#f5f5f5', 'food')]
        : []
    },
    source() {
      return Mock.Random.pick(['外卖', '到店', ''])
    },
    'purchaseTimes|1-8': 1,
    'tags': '@reviewTags',
  }],
}).list

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
    count: index === 0 ? reviews.length : Mock.Random.integer(1, reviews.length),
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
