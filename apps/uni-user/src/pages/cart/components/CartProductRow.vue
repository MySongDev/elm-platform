<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/cart/components/CartProductRow.vue 同源改造。
 * 差异：img → image（mode=aspectFill 对应 object-fit: cover）；
 * article/div/h3/p/span/button → view/text；px → rpx；
 * ① 类不转：stepper 的 border 1px、quantity 的 border-inline 1px、
 * product-tag 的 vertical-align 1px。
 */
import CartCheckButton from './CartCheckButton.vue'

defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['toggle', 'increase', 'decrease'])
</script>

<template>
  <view class="cart-product">
    <CartCheckButton
      :checked="product.selected"
      :aria-label="product.selected ? '取消选择商品' : '选择商品'"
      @click="emit('toggle', product.id)"
    />

    <image
      class="product-image"
      :src="product.image"
      :aria-label="product.name"
      mode="aspectFill"
    />

    <view class="product-content">
      <text class="product-name">
        <text
          v-if="product.tag"
          class="product-tag"
        >
          {{ product.tag }}
        </text>
        {{ product.name }}
      </text>
      <text
        v-if="product.spec"
        class="product-spec"
      >
        {{ product.spec }}
      </text>

      <view class="product-bottom">
        <view class="price-wrap">
          <text class="currency">
            ¥
          </text>
          <text class="price">
            {{ product.price }}
          </text>
          <text class="origin-price">
            ¥{{ product.originPrice }}
          </text>
        </view>
        <view class="quantity-stepper">
          <view
            class="stepper-button"
            :class="{ disabled: product.quantity <= 1 }"
            aria-label="减少商品数量"
            @click="product.quantity > 1 && emit('decrease', product.id)"
          >
            −
          </view>
          <text class="quantity">
            {{ product.quantity }}
          </text>
          <view
            class="stepper-button"
            aria-label="增加商品数量"
            @click="emit('increase', product.id)"
          >
            +
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cart-product {
  display: flex;
  gap: 24rpx;
  align-items: center;
  padding-bottom: 40rpx;
}

.product-image {
  flex: 0 0 176rpx;
  width: 176rpx;
  height: 156rpx;
  background: #f2f3f5;
  border-radius: 12rpx;
}

.product-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-self: stretch;
  justify-content: space-between;
  min-width: 0;
  padding: 4rpx 0;
}

.product-name {
  overflow: hidden;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-tag {
  display: inline-flex;
  align-items: center;
  height: 40rpx;
  padding: 0 10rpx;
  margin-right: 4rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
  vertical-align: 1px; /* ① 类 vertical-align 不转 */
  background: #d8843e;
  border-radius: 8rpx 0;
}

.product-spec {
  margin: 12rpx 0 0;
  font-size: 24rpx;
  line-height: 1.4;
  color: #8f8f8f;
}

.product-bottom {
  display: flex;
  gap: 20rpx;
  align-items: center;
  justify-content: space-between;
}

.price-wrap {
  display: flex;
  align-items: baseline;
  min-width: 0;
  color: #f4342d;
}

.currency {
  font-size: 26rpx;
  font-weight: 700;
}

.price {
  margin-left: 4rpx;
  font-size: 44rpx;
  line-height: 1;
}

.origin-price {
  margin-left: 20rpx;
  font-size: 24rpx;
  color: #777;
  text-decoration: line-through;
}

.quantity-stepper {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  height: 60rpx;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d9dce1; /* ① 类 border 不转 */
  border-radius: 18rpx;
}

.stepper-button {
  width: 56rpx;
  height: 100%;
  font-size: 34rpx;
  line-height: 60rpx;
  text-align: center;
  background: #fff;

  &.disabled {
    color: #c7c7c7;
  }
}

.quantity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  font-size: 28rpx;
  border-inline: 1px solid #edf0f3; /* ① 类 border 不转 */
}
</style>
