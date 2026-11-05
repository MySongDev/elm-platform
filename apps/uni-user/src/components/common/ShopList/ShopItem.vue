<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/ShopList/ShopItem.vue 同源改造。
 * 差异：
 * 1. li/div/span/h4/p → view/text（小程序无 HTML 标签）
 * 2. SmartImage 换 uni-user 版（调度模型已退化，见其文件头）
 * 3. px → rpx（×2）；发丝 border 0.5px 保留（① 类不转）
 * 4. `imgBaseUrl` prop 移除：uni-user 的图片 URL 一律走 platform/image（后端代理），
 *    调用方不需要也不能指定第三方域名（白名单约束）。⚠️ 若调用方传了会被忽略。
 */
import SmartImage from '@/components/common/SmartImage/SmartImage.vue'
import StarRating from '@/components/common/StarRating.vue'
import { getImageUrl } from '@/platform/image'

const {
  item,
} = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['click'])

// 跳转由父组件决定（emit click），组件内不碰导航 —— 与 web-user 一致
function navToShop() {
  emit('click', item)
}
</script>

<template>
  <view
    class="shopping-item"
    @click="navToShop"
  >
    <SmartImage
      :src="getImageUrl(item.image_path)"
      :alt="item.name"
      class="item-img"
    />
    <view class="shop-item_right">
      <view class="shop-detail_header">
        <text class="shop-detail_name">
          {{ item.name }}
        </text>
        <view class="shop-detail_supports">
          <text
            v-for="(support, idx) in item.supports"
            :key="idx"
            class="shop-detail_supported-methods"
          >
            {{ support.icon_name }}
          </text>
        </view>
      </view>

      <view class="shop-item_center-content">
        <view class="rating">
          <!-- ⚠️ :model-value 而非 v-model：StarRating 只读展示，回写会污染调用方的 item 对象 -->
          <StarRating :model-value="item.rating" />
          <text class="monthly_sales">
            月售{{ item.recent_order_num }}单
          </text>
        </view>
        <view class="delivery-methods">
          <text
            v-if="item.delivery_mode"
            class="delivery_span span-bg-blue"
          >
            {{ item.delivery_mode.text }}
          </text>
          <text class="delivery_span span-bg-white">
            准时达
          </text>
        </view>
      </view>

      <view class="fee-distance">
        <text class="fee">
          ¥{{ item.float_minimum_order_amount }}元起送/{{ item.piecewise_agent_fee?.tips }}
        </text>
        <text class="distance">
          {{ item.distance }}/<text class="lead-time">
            {{ item.order_lead_time }}
          </text>
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.shopping-item {
  display: flex;
  align-items: center;
  padding: 33rpx 18.6rpx;
  background: #fff;
  border-bottom: 0.5px solid #e2e2e2; /* 发丝线不转（① 类 border） */

  &:active {
    background: #f5f5f5;
  }

  .item-img {
    width: 128rpx;
    height: 128rpx;
    margin-right: 20rpx;
    border-radius: 8rpx;
  }
}

.shop-item_right {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
}

.shop-detail_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .shop-detail_name {
    @include text-ellipsis;

    flex: 1;
    font-size: 32rpx;
    font-weight: 700;

    &::before {
      padding: 2rpx 8rpx; /* ① 类可转：padding 的 1px */
      margin-right: 16rpx;
      font-size: 24rpx;
      content: '品牌';
      background: #ffd930;
      border-radius: 8rpx;
    }
  }

  .shop-detail_supports {
    display: flex;
    gap: 8rpx;
  }

  .shop-detail_supported-methods {
    padding: 0 4rpx;
    font-size: 20rpx;
    color: #999;
    border: 0.6px solid #f1f1f1; /* 发丝线不转 */
    border-radius: 4rpx;
  }
}

.shop-item_center-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .rating {
    display: flex;
    gap: 12rpx;
    align-items: center;
  }

  .monthly_sales {
    color: #666;
  }

  .delivery-methods {
    display: flex;
    gap: 8rpx;
    transform: scale(0.85);
    transform-origin: right center;
  }

  .delivery_span {
    padding: 2rpx 8rpx; /* ① 类可转 */
    font-size: 20rpx;
    white-space: nowrap;
    border: 0.6px solid $blue; /* 发丝线不转 */
    border-radius: 4rpx;
  }

  .span-bg-blue {
    color: #fff;
    background: $blue;
  }

  .span-bg-white {
    color: $blue;
    background: #fff;
  }
}

.fee-distance {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;

  .fee {
    color: #666;
  }

  .distance {
    color: #999;

    .lead-time {
      color: $blue;
    }
  }
}
</style>
