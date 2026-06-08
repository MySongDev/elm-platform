<!-- components/ShopReview/ReviewList.vue -->
<script setup>
import { computed, toRef } from 'vue'
import { useInfiniteScroll } from '@/composables/ui'
import ReviewItem from './ReviewItem.vue'

const props = defineProps({
  reviews: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  finished: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['reach-bottom'])

const hasReviews = computed(() => props.reviews.length > 0)
const isInitialLoading = computed(() => props.loading && props.reviews.length === 0)

const { sentinel } = useInfiniteScroll({
  loading: toRef(props, 'loading'),
  finished: toRef(props, 'finished'),
  callback: () => emit('reach-bottom'),
})
</script>

<template>
  <div class="review-list">
    <!-- 平台诚信提示 -->
    <div class="integrity-tip">
      <span class="shield-icon">🛡</span>
      美团外卖鼓励真实、有帮助的评价
    </div>

    <!-- 初始加载骨架 -->
    <div v-if="isInitialLoading" class="loading-placeholder">
      <div v-for="i in 3" :key="i" class="skeleton-item">
        <div class="skeleton skeleton-avatar" />
        <div class="skeleton-body">
          <div class="skeleton skeleton-line w60" />
          <div class="skeleton skeleton-line w40" />
          <div class="skeleton skeleton-line w80" />
        </div>
      </div>
    </div>

    <!-- 评价列表 -->
    <template v-else>
      <template v-if="hasReviews">
        <ReviewItem v-for="review in reviews" :key="review.id" :review="review" />
      </template>
      <div v-else class="empty-tip">
        数据为空
      </div>
    </template>

    <!-- 底部加载状态 -->
    <div v-show="!isInitialLoading && reviews.length > 0" ref="sentinel" class="list-footer">
      <div v-if="loading" class="loading-status">
        <van-loading size="16px">
          加载中...
        </van-loading>
      </div>
      <div v-else-if="finished" class="finished-status">
        —— 到底了 ——
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.review-list {
  background: #fff;
}

.integrity-tip {
  display: flex;
  gap: 1.6vw;
  align-items: center;
  padding: 2.4vw 3.2vw;
  font-size: 3vw;
  color: #999;
  border-bottom: 1px solid #f0f0f0;

  .shield-icon {
    font-size: 3.4vw;
  }
}

.empty-tip {
  padding: 10vw;
  font-size: 3.6vw;
  color: #bbb;
  text-align: center;
}

// ---- Skeleton ----
.loading-placeholder {
  padding: 0 3.2vw;
}

.skeleton-item {
  display: flex;
  gap: 3.2vw;
  padding: 4vw 0;
  border-bottom: 1px solid #f5f5f5;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.4s infinite;
}

.skeleton-avatar {
  flex-shrink: 0;
  width: 10.67vw;
  height: 10.67vw;
  border-radius: 50%;
}

.skeleton-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2vw;
}

.skeleton-line {
  height: 3.2vw;

  &.w60 {
    width: 60%;
  }

  &.w40 {
    width: 40%;
  }

  &.w80 {
    width: 80%;
  }
}

.list-footer {
  padding: 15px 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
