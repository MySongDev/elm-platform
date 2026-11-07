<script setup>
/**
 * 评价列表（筛选条 + 分页列表）。
 *
 * ⚠️ 与 web-user ShopReview/ReviewItem/ReviewFilterBar 三件套的差异：
 * 1. 三组件合一：web-user 拆三层是为了复用滚动容器，小程序端滚动在页面级
 *    scroll-view，这里没有复用点，拆开只是多两层 props 传递
 * 2. 字段按**自家后端实际返回**渲染（elm-food.service.ts:220-240 的 mock 形状）：
 *    username / rating_star / rated_at / time_spent_desc / rating_text /
 *    item_ratings[].food_name / avatar。web-user 的 ReviewItem 按上游 elm.cangdu.org
 *    的形状写（nickname / productStar / images / reply…），那些键后端一个都不返回，
 *    搬过来整页都是空字段
 * 3. 筛选是**前端过滤已加载页**（与 web-user 同语义）：后端 getRatings 不收 tag 参数，
 *    且 mock 数据本身不带 tag 字段 → 选「满意」等标签会过滤出空列表。
 *    这是后端 mock 的既有行为，不是本页引入的缺陷；后端补 tag 字段后此处无需改
 */
import { computed, ref, watch } from 'vue'

import { useLoadMore } from '@/composables/app'
import { getImageUrl } from '@/config'
import { getShopRatings, getShopReviewFilters } from '@/services/api/api-shop'

const props = defineProps({
  shopId: {
    type: [String, Number],
    default: null,
  },
})

const filters = ref([])
const activeFilter = ref('全部')

const {
  list: allReviews,
  loading,
  finished,
  loadMore,
} = useLoadMore(
  ({ page, pageSize }) => getShopRatings(props.shopId, (page - 1) * pageSize, pageSize),
  {
    pageSize: 20,
    // shopId 来自 onLoad，setup 时可能还是空串；由下面的 watch 触发首 load
    immediate: false,
    dedupKey: null,
  },
)

watch(
  () => props.shopId,
  (id) => {
    if (id == null || id === '') {
      return
    }
    loadMore()
    getShopReviewFilters(id).then((tags) => {
      filters.value = Array.isArray(tags) ? tags : []
    }).catch(() => {
      filters.value = []
    })
  },
  { immediate: true },
)

// mock 数据无 tag 字段 → 非「全部」标签过滤结果为空是预期行为（见头注释 3）
const filteredReviews = computed(() => {
  if (activeFilter.value === '全部') {
    return allReviews.value
  }
  return allReviews.value.filter(review => (review.tags || []).includes(activeFilter.value))
})

// 模板里不做 map/join（小程序端表达式收敛到 script，见 CartBar 同款注释）
function foodNames(review) {
  return (review.item_ratings || []).map(item => item.food_name).join('、')
}

function onScrollToLower() {
  loadMore()
}
</script>

<template>
  <scroll-view
    class="shop-review"
    scroll-y
    :lower-threshold="80"
    @scrolltolower="onScrollToLower"
  >
    <view v-if="filters.length" class="filter-bar">
      <view
        v-for="item in filters"
        :key="item.name"
        class="filter-tag"
        :class="{ active: activeFilter === item.name }"
        @click="activeFilter = item.name"
      >
        <text>{{ item.name }}</text>
        <text>({{ item.count }})</text>
      </view>
    </view>

    <view v-for="(review, index) in filteredReviews" :key="index" class="review-item">
      <view class="review-item__user">
        <SmartImage
          class="review-item__avatar"
          :src="getImageUrl(review.avatar)"
          :alt="review.username"
          :skeleton="false"
        />
        <view class="review-item__meta">
          <text class="review-item__name">
            {{ review.username }}
          </text>
          <view class="review-item__stars">
            <text class="star-line">
              ⭐ 商品{{ review.rating_star }}星
            </text>
            <text class="review-item__date">
              {{ review.rated_at }}
            </text>
          </view>
        </view>
      </view>

      <text class="review-item__text">
        {{ review.rating_text || '该用户没有填写内容' }}
      </text>

      <view v-if="review.item_ratings?.length" class="review-item__foods">
        <text class="review-item__food-tag">
          好评商品：{{ foodNames(review) }}
        </text>
      </view>

      <text v-if="review.time_spent_desc" class="review-item__delivery">
        {{ review.time_spent_desc }}
      </text>
    </view>

    <BaseState v-if="!filteredReviews.length" :state="loading ? 'loading' : 'empty'" />

    <view v-if="filteredReviews.length" class="review-foot">
      <text v-if="loading">
        加载中…
      </text>
      <text v-else-if="finished">
        没有更多了
      </text>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.shop-review {
  height: 100%;
  background: #fff;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 24rpx 24rpx 16rpx;
}

.filter-tag {
  display: inline-flex;
  gap: 4rpx;
  align-items: center;
  padding: 10rpx 24rpx;
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
  background: #f5f5f5;
  border-radius: 40rpx;

  &.active {
    font-weight: 600;
    color: #ff8c00;
    background: #fff8e6;
  }
}

.review-item {
  padding: 24rpx;
  border-bottom: 1px solid #f0f0f0;
}

.review-item__user {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 16rpx;
}

.review-item__avatar {
  flex-shrink: 0;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.review-item__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.review-item__name {
  overflow: hidden;
  font-size: 26rpx;
  font-weight: 600;
  color: #222;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-item__stars {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.star-line {
  font-size: 22rpx;
  color: #ff6b00;
}

.review-item__date {
  font-size: 22rpx;
  color: #bbb;
}

.review-item__text {
  display: block;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #222;
}

.review-item__foods {
  margin-bottom: 12rpx;
}

.review-item__food-tag {
  display: inline-block;
  padding: 8rpx 16rpx;
  font-size: 22rpx;
  color: #555;
  background: #f5f5f5;
  border-radius: 8rpx;
}

.review-item__delivery {
  font-size: 22rpx;
  color: #999;
}

.review-foot {
  padding: 24rpx 0 40rpx;
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
</style>
