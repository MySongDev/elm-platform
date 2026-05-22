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
  const map = { 5: '😍', 4: '😊', 3: '😐', 2: '😕', 1: '😞' }
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
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

// ---- 用户行 ----
.user-row {
  display: flex;
  align-items: flex-start;
  gap: 2.4vw;
  margin-bottom: 3vw;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 10.67vw;
  height: 10.67vw;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffd4a8;
  color: #fff;
  font-size: 4vw;
  font-weight: 700;
}

.source-badge {
  position: absolute;
  bottom: -1vw;
  left: 50%;
  transform: translateX(-50%);
  background: #4caf50;
  color: #fff;
  font-size: 2.2vw;
  padding: 0.3vw 1.2vw;
  border-radius: 3px;
  white-space: nowrap;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.6vw;
  margin-bottom: 1.2vw;
}

.nickname {
  font-size: 3.7vw;
  font-weight: 600;
  color: #222;
}

.member-badge {
  font-size: 2.8vw;
  padding: 0.4vw 1.6vw;
  border-radius: 10px;
  font-weight: 500;

  &.gold {
    background: #fff3d6;
    color: #d4870a;
  }

  &.black {
    background: #333;
    color: #d4a84b;
  }
}

.purchase-times {
  font-size: 2.8vw;
  color: #ff6b00;
  background: #fff0e6;
  padding: 0.4vw 1.6vw;
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
  flex-direction: column;
  align-items: flex-end;
  gap: 1vw;
  flex-shrink: 0;
}

.date {
  font-size: 3vw;
  color: #bbb;
}

.more-btn {
  color: #ccc;
  font-size: 4vw;
  cursor: pointer;
  letter-spacing: 1px;
}

// ---- 正文 ----
.review-content {
  margin-bottom: 2.4vw;
}

.review-text {
  font-size: 4vw;
  color: #222;
  line-height: 1.6;
  margin: 0 0 2vw;

  &.empty {
    color: #999;
    font-size: 3.6vw;
  }
}

.image-list {
  display: flex;
  gap: 2vw;
  flex-wrap: wrap;
}

.review-image {
  width: 22vw;
  height: 22vw;
  border-radius: 4px;
  object-fit: cover;
}

// ---- 好评商品 ----
.related-product {
  display: flex;
  align-items: center;
  margin-bottom: 2.4vw;
  font-size: 3.2vw;
  color: #555;
  gap: 1vw;
}

.related-label {
  background: #f5f5f5;
  padding: 1.2vw 2.4vw;
  border-radius: 4px;
  flex: 1;
}

.chevron {
  color: #bbb;
  font-size: 3.6vw;
}

.useful {
  display: flex;
  align-items: center;
  gap: 1vw;
  margin-left: auto;
  color: #999;
  font-size: 3.2vw;
  white-space: nowrap;
}

.thumb-icon {
  font-size: 3.4vw;
}

// ---- 商家回复 ----
.merchant-reply {
  background: #f7f7f7;
  border-radius: 6px;
  padding: 2.4vw 3.2vw;
  font-size: 3.2vw;
  color: #555;
  line-height: 1.5;
}

.reply-prefix {
  color: #333;
  font-weight: 500;
}

.reply-text {
  color: #666;
}

.expand-btn {
  color: #ff8c00;
  margin-left: 1vw;
  cursor: pointer;
  font-size: 3.2vw;
}
</style>
