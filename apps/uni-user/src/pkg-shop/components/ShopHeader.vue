<script setup>
/**
 * 商家信息卡（对齐美团 shop 页头部）。
 *
 * ⚠️ 刻意不迁 web-user 的 ShopHeader.vue：它带优惠券轮播（DynamicCoupon）、
 * 展开/收起、公告多行等交互，本次重设计按美团样式只做「图 + 名 + 三指标 + 简介」。
 * 字段取后端 toRestaurantResponse 的实际形状（elm.assemblers.ts:57-90），
 * ⚠️ 月售是 `recent_order_num`，不是 `recent_order_popularity`（后者是上游 elm.cangdu.org
 * 的键，自家后端不返回 → 写错则恒显示 0，2026-10-16 真机坐实）
 */
import { getImageUrl } from '@/config'

defineProps({
  shop: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <view v-if="shop" class="shop-header">
    <view class="shop-header__row">
      <SmartImage
        class="shop-header__img"
        :src="getImageUrl(shop.image_path)"
        :alt="shop.name"
        :eager="true"
      />
      <view class="shop-header__info">
        <text class="shop-header__name">
          {{ shop.name }}
        </text>
        <view class="shop-header__stats">
          <view class="stat">
            <text class="stat__label">
              评分
            </text>
            <text class="stat__value">
              {{ shop.rating ?? '-' }}
            </text>
          </view>
          <view class="stat__divider" />
          <view class="stat">
            <text class="stat__label">
              月售
            </text>
            <text class="stat__value">
              {{ shop.recent_order_num ?? 0 }}
            </text>
          </view>
          <view class="stat__divider" />
          <view class="stat">
            <text class="stat__label">
              商家自配
            </text>
            <text class="stat__value">
              约{{ shop.order_lead_time ?? '-' }}分钟
            </text>
          </view>
        </view>
      </view>
    </view>
    <text v-if="shop.description" class="shop-header__desc">
      {{ shop.description }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.shop-header {
  padding: 24rpx;
  background: #fff;
}

.shop-header__row {
  display: flex;
  gap: 20rpx;
}

/* 固定宽高：SmartImage 内部是 width/height 100%，宿主必须给定尺寸 */
.shop-header__img {
  flex-shrink: 0;
  width: 144rpx;
  height: 144rpx;
  border-radius: 12rpx;
}

.shop-header__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16rpx;
  min-width: 0;
  padding-top: 4rpx;
}

.shop-header__name {
  overflow: hidden;
  font-size: 36rpx;
  font-weight: 700;
  color: #222;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-header__stats {
  display: flex;
  align-items: center;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.stat__label {
  font-size: 22rpx;
  color: #999;
}

.stat__value {
  font-size: 26rpx;
  font-weight: 700;
  color: #222;
}

.stat__divider {
  width: 1px;
  height: 44rpx;
  margin: 0 24rpx;
  background: #e5e5e5;
}

.shop-header__desc {
  display: -webkit-box;
  margin-top: 20rpx;
  overflow: hidden;
  font-size: 24rpx;
  line-height: 1.5;
  color: #999;

  /* 小程序端 -webkit-line-clamp 可用（web-view 内核），两行截断 */
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
