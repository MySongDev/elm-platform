<script setup>
/**
 * 菜品行（左图右文 + 价格 + 加减）。
 *
 * ⚠️ 与 web-user MenuFoodItem.vue 的差异：
 * 1. 「选规格」分支整体移除：后端 specifications 恒为空数组（上游数据无规格），
 *    FoodSpecPanel 迁过来是死代码；将来上游真有规格再按小程序弹窗重做
 * 2. v-lazy 指令 → SmartImage（小程序无 IntersectionObserver，见 SmartImage 头注释）
 * 3. 抛物线飞入动画移除：getBoundingClientRect 在小程序端要换 createSelectorQuery
 *    （异步），加购反馈改由购物车角标数量即时变化承担
 */
import { computed } from 'vue'

import { getImageUrl } from '@/config'

import {
  getCartQty,
  getFoodActivityBoxStyle,
  getFoodActivityTextStyle,
  getFoodOriginalPrice,
  getFoodPrice,
  getFoodTipsLine,
} from './foodUtils'

const props = defineProps({
  food: {
    type: Object,
    required: true,
  },
  cartMap: {
    type: Map,
    default: () => new Map(),
  },
})

const emit = defineEmits(['add', 'decrease'])

const cartQty = computed(() => getCartQty(props.cartMap, props.food))
</script>

<template>
  <view class="food-item">
    <SmartImage
      class="food-item__img"
      :src="getImageUrl(food.image_path)"
      :alt="food.name"
    />

    <view class="food-item__detail">
      <text class="food-item__name">
        {{ food.name }}
      </text>

      <view v-if="food.attributes?.length" class="food-item__labels">
        <text
          v-for="attr in food.attributes"
          :key="`${food._id}-${attr?.icon_name}`"
          class="label"
          :style="{ color: `#${attr?.icon_color}`, borderColor: `#${attr?.icon_color}` }"
        >
          {{ attr?.icon_name }}
        </text>
      </view>

      <view v-if="food.activity?.image_text" class="food-item__activity" :style="getFoodActivityBoxStyle(food)">
        <text :style="getFoodActivityTextStyle(food)">
          {{ food.activity.image_text }}
        </text>
      </view>

      <text class="food-item__tips">
        {{ getFoodTipsLine(food) }}
      </text>

      <view class="food-item__bottom">
        <view class="price-block">
          <text class="price">
            <text class="price__sign">
              ¥
            </text>{{ getFoodPrice(food) }}
          </text>
          <text v-if="getFoodOriginalPrice(food) > 0" class="price__old">
            ¥{{ getFoodOriginalPrice(food) }}
          </text>
        </view>

        <view class="cart-btns">
          <view v-if="cartQty > 0" class="decrease-btn" @click.stop="emit('decrease', food)">
            <text>−</text>
          </view>
          <text v-if="cartQty > 0" class="qty">
            {{ cartQty }}
          </text>
          <view class="add-btn" @click.stop="emit('add', food)">
            <text>+</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.food-item {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.food-item__img {
  flex-shrink: 0;
  width: 156rpx;
  height: 156rpx;
  border-radius: 16rpx;
}

.food-item__detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.food-item__name {
  display: -webkit-box;
  overflow: hidden;
  font-size: 30rpx;
  font-weight: 700;
  color: #222;
  text-overflow: ellipsis;

  /* 美团式两行标题 */
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.food-item__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}

.label {
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  font-weight: 600;
  border: 1px solid currentcolor;
  border-radius: 4rpx;
}

.food-item__activity {
  display: inline-block;
  align-self: flex-start;
  padding: 4rpx 12rpx;
  margin-top: 10rpx;
  font-size: 22rpx;
  font-weight: 600;
  border-radius: 8rpx;
}

.food-item__tips {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #999;
}

.food-item__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 12rpx;
  margin-top: auto;
}

.price-block {
  display: flex;
  gap: 12rpx;
  align-items: baseline;
}

.price {
  font-size: 36rpx;
  font-weight: 800;
  color: #fb4e44;
}

.price__sign {
  margin-right: 2rpx;
  font-size: 24rpx;
  font-style: normal;
}

.price__old {
  font-size: 24rpx;
  color: #bbb;
  text-decoration: line-through;
}

.cart-btns {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.decrease-btn,
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  font-size: 32rpx;
  line-height: 1;
  border-radius: 50%;
}

.decrease-btn {
  color: #666;
  background: #fff;
  border: 1px solid #ddd;
}

.add-btn {
  color: #333;
  background: #ffd600;
}

.qty {
  min-width: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
}
</style>
