<script setup>
import { getImageUrl } from '@/config'

import DynamicCoupon from './DynamicCoupon.vue'

/** 商家页头部：横幅、店名、评分与活动条 */
defineProps({
  shop: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <header class="shop-header">
    <div v-if="shop.image_path !== ''" class="shop-header__banner">
      <img :src="getImageUrl(shop.image_path)" :alt="shop.name" loading="lazy">
    </div>

    <section class="shop-header__main">
      <div class="shop-header__logo">
        <img :src="getImageUrl(shop.image_path)" :alt="shop.name">
      </div>

      <div class="shop-header__content">
        <h1 class="shop-header__title">
          {{ shop.name }}
        </h1>

        <div class="shop-header__stats">
          <div class="stat-item">
            <span class="stat-item__label">综合分</span>
            <span class="stat-item__value">{{ shop.rating }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__label">已售</span>
            <span class="stat-item__value">{{ shop.recent_order_num }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item__label">约</span>
            <span class="stat-item__value">{{ shop.recent_order_num }}分钟</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="shop.activities?.length > 0" class="shop-header__activities">
      <DynamicCoupon v-for="item in shop.activities" :key="item._id" :title="item.description"
        :action-text="item.icon_name" class="activity-coupon" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
// 变量收敛
$color-text-main: #333;
$color-text-secondary: #888;
$white: #fff;

.shop-header {
  background: $white;
  padding: 0px 10px 10px 10px;
  border-radius: 0 0 12px 12px;

  // 1. Banner 区：使用 aspect-ratio 保持比例
  &__banner {
    width: 100%;
    aspect-ratio: 2 / 1; // 替代 50vw，防止大屏下高度失控
    border-radius: 15px;
    overflow: hidden;
    margin-bottom: 15px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  // 2. 主内容区
  &__main {
    display: flex;
    align-items: flex-start;
  }

  &__logo {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    margin-right: 14px;
    border-radius: 12px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
    }
  }

  &__content {
    flex: 1;
    min-width: 0; // 防止长文字撑破 flex 容器
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
    color: $color-text-main;
    margin-bottom: 8px;
    @include text-ellipsis(); // 建议封装的单行截断
  }

  // 3. 统计行：使用扁平化命名空间
  &__stats {
    display: flex;
    gap: 15px; // 使用 gap 替代 margin-right，更简洁

    .stat-item {
      display: flex;
      flex-direction: column;
      font-size: 12px;
      color: $color-text-secondary;

      &__value {
        font-size: 15px;
        font-weight: 600;
        color: $color-text-main;
        margin-top: 2px;
      }
    }
  }

  // 4. 滚动区优化
  &__activities {
    display: flex;
    margin-top: 12px;
    overflow-x: auto;
    gap: 4px;
    -webkit-overflow-scrolling: touch; // 移动端滚动丝滑
    scrollbar-width: none; // Firefox

    &::-webkit-scrollbar {
      display: none; // Chrome/Safari
    }

    .activity-coupon {
      flex-shrink: 0; // 核心：防止被 flex 挤压宽度
    }
  }
}
</style>
