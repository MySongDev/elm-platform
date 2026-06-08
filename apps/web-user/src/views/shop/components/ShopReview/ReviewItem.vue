<!-- components/ShopReview/ReviewItem.vue -->
<script setup>
import { ref } from 'vue'

defineProps({
  review: {
    type: Object,
    required: true,
  },
})

const replyExpanded = ref(false)

function toggleReply() {
  replyExpanded.value = !replyExpanded.value
}

// 渲染星级
function getStarLabel(score) {
  const map = {
    5: '😍',
    4: '😊',
    3: '😐',
    2: '😕',
    1: '😞',
  }
  return map[score] || '😊'
}
</script>

<template>
  <div class="review-item">
    <!-- 用户信息行 -->
    <div class="user-row">
      <div class="avatar-wrap">
        <img v-if="review.avatar" v-lazy="review.avatar" class="avatar" :alt="review.nickname">
        <div v-else class="avatar avatar-placeholder">
          {{ review.nickname?.[0] }}
        </div>
        <!-- 来源标签 (票来等) -->
        <span v-if="review.source" class="source-badge">{{ review.source }}</span>
      </div>

      <div class="user-info">
        <div class="name-row">
          <span class="nickname">{{ review.nickname }}</span>
          <span v-if="review.memberBadge" class="member-badge" :class="review.memberBadge.type">
            🤝 {{ review.memberBadge.label }}
          </span>
          <span v-if="review.purchaseTimes" class="purchase-times">买过{{ review.purchaseTimes }}次</span>
        </div>
        <div class="star-row">
          <span class="star-item">{{ getStarLabel(review.productStar) }} 商品{{ review.productStar }}星</span>
          <span class="star-item">{{ getStarLabel(review.packageStar) }} 包装{{ review.packageStar }}星</span>
        </div>
      </div>

      <div class="meta-right">
        <span class="date">{{ review.date }}</span>
        <span class="more-btn">···</span>
      </div>
    </div>

    <!-- 评价正文 -->
    <div class="review-content">
      <p class="review-text" :class="{ empty: !review.content }">
        {{ review.content || '该用户没有填写内容' }}
      </p>
      <!-- 图片列表 -->
      <div v-if="review.images && review.images.length" class="image-list">
        <img v-for="(img, i) in review.images" :key="i" v-lazy="img" class="review-image">
      </div>
    </div>

    <!-- 好评商品标签 -->
    <div v-if="review.relatedProduct" class="related-product">
      <span class="related-label">好评商品：{{ review.relatedProduct }}</span>
      <span class="chevron">›</span>
      <span class="useful">
        <span class="thumb-icon">👍</span> 有用{{ review.usefulCount ?? '' }}
      </span>
    </div>

    <!-- 商家回复 -->
    <div v-if="review.reply" class="merchant-reply">
      <span class="reply-prefix">商家回复：</span>
      <span class="reply-text">
        {{ replyExpanded ? review.reply : review.reply.slice(0, 28) + (review.reply.length > 28 ? '...' : '') }}
      </span>
      <span v-if="review.reply.length > 28" class="expand-btn" @click="toggleReply">
        {{ replyExpanded ? '收起' : '展开' }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.review-item {
  padding: 4vw 3.2vw;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

// ---- 用户行 ----
.user-row {
  display: flex;
  gap: 2.4vw;
  align-items: flex-start;
  margin-bottom: 3vw;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 10.67vw;
  height: 10.67vw;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4vw;
  font-weight: 700;
  color: #fff;
  background: #ffd4a8;
}

.source-badge {
  position: absolute;
  bottom: -1vw;
  left: 50%;
  padding: 0.3vw 1.2vw;
  font-size: 2.2vw;
  color: #fff;
  white-space: nowrap;
  background: #4caf50;
  border-radius: 3px;
  transform: translateX(-50%);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.6vw;
  align-items: center;
  margin-bottom: 1.2vw;
}

.nickname {
  font-size: 3.7vw;
  font-weight: 600;
  color: #222;
}

.member-badge {
  padding: 0.4vw 1.6vw;
  font-size: 2.8vw;
  font-weight: 500;
  border-radius: 10px;

  &.gold {
    color: #d4870a;
    background: #fff3d6;
  }

  &.black {
    color: #d4a84b;
    background: #333;
  }
}

.purchase-times {
  padding: 0.4vw 1.6vw;
  font-size: 2.8vw;
  color: #ff6b00;
  background: #fff0e6;
  border-radius: 10px;
}

.star-row {
  display: flex;
  gap: 2.4vw;
}

.star-item {
  font-size: 3vw;
  color: #ff6b00;
}

.meta-right {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 1vw;
  align-items: flex-end;
}

.date {
  font-size: 3vw;
  color: #bbb;
}

.more-btn {
  font-size: 4vw;
  color: #ccc;
  letter-spacing: 1px;
  cursor: pointer;
}

// ---- 正文 ----
.review-content {
  margin-bottom: 2.4vw;
}

.review-text {
  margin: 0 0 2vw;
  font-size: 4vw;
  line-height: 1.6;
  color: #222;

  &.empty {
    font-size: 3.6vw;
    color: #999;
  }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2vw;
}

.review-image {
  width: 22vw;
  height: 22vw;
  object-fit: cover;
  border-radius: 4px;
}

// ---- 好评商品 ----
.related-product {
  display: flex;
  gap: 1vw;
  align-items: center;
  margin-bottom: 2.4vw;
  font-size: 3.2vw;
  color: #555;
}

.related-label {
  flex: 1;
  padding: 1.2vw 2.4vw;
  background: #f5f5f5;
  border-radius: 4px;
}

.chevron {
  font-size: 3.6vw;
  color: #bbb;
}

.useful {
  display: flex;
  gap: 1vw;
  align-items: center;
  margin-left: auto;
  font-size: 3.2vw;
  color: #999;
  white-space: nowrap;
}

.thumb-icon {
  font-size: 3.4vw;
}

// ---- 商家回复 ----
.merchant-reply {
  padding: 2.4vw 3.2vw;
  font-size: 3.2vw;
  line-height: 1.5;
  color: #555;
  background: #f7f7f7;
  border-radius: 6px;
}

.reply-prefix {
  font-weight: 500;
  color: #333;
}

.reply-text {
  color: #666;
}

.expand-btn {
  margin-left: 1vw;
  font-size: 3.2vw;
  color: #ff8c00;
  cursor: pointer;
}
</style>
