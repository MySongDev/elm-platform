<!-- components/ShopReview/ShopReview.vue -->
<script setup>
import { computed, ref } from 'vue'
import { getShopRatings, getShopReviewFilters } from '@/services/api/api-shop'
import { useLoadMore } from '@/composables/app'
import ReviewFilterBar from './ReviewFilterBar.vue'
import ReviewList from './ReviewList.vue'

const props = defineProps({
  shopId: {
    type: [String, Number],
    default: null,
  },
})

// ==================== 数据状态 ====================
const FILTERS = ref([])
const activeFilter = ref('全部')

const {
  list: allReviews,
  loading,
  finished,
  loadMore,
} = useLoadMore(
  ({ page, pageSize }) => getShopRatings(props.shopId, (page - 1) * pageSize, pageSize),
  { pageSize: 20 },
)

// ==================== 过滤计算 ====================
const filteredReviews = computed(() => {
  if (activeFilter.value === '全部')
    return allReviews.value
  return allReviews.value.filter(r => r.tags.includes(activeFilter.value))
})

// ==================== 数据加载 ====================
// 评价筛选标签仍然一次性加载
async function loadFilters() {
  const reviewFilters = await getShopReviewFilters(props.shopId)
  FILTERS.value = reviewFilters
}
loadFilters()
</script>

<template>
  <!--
    新架构说明：
    ShopReview 本身不再需要处理任何滚动逻辑。
    它的父容器（reviewScrollRef）是独立的滚动容器，
    ShopReview 只需要作为普通内容块填充其中即可。

    ReviewFilterBar 不再需要 position: sticky，
    如需吸顶可在此处添加，基准是独立容器的顶部（top: 0）
  -->
  <div class="shop-review">
    <ReviewFilterBar v-model="activeFilter" :filters="FILTERS" />
    <ReviewList :reviews="filteredReviews" :loading="loading" :finished="finished" @reach-bottom="loadMore" />
  </div>
</template>

<style lang="scss" scoped>
.shop-review {
  width: 100%;
  min-height: 100%;
  background: #f6f6f6;
}
</style>
