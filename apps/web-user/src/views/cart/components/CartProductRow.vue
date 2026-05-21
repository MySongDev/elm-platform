<script setup>
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
  <article class="cart-product">
    <CartCheckButton :checked="product.selected" :aria-label="product.selected ? '取消选择商品' : '选择商品'"
      @click="emit('toggle', product.id)" />

    <img class="product-image" :src="product.image" :alt="product.name">

    <div class="product-content">
      <h3 class="product-name">
        <span v-if="product.tag" class="product-tag">{{ product.tag }}</span>
        {{ product.name }}
      </h3>
      <p v-if="product.spec" class="product-spec">
        {{ product.spec }}
      </p>

      <div class="product-bottom">
        <div class="price-wrap">
          <span class="currency">¥</span>
          <strong class="price">{{ product.price }}</strong>
          <span class="origin-price">¥{{ product.originPrice }}</span>
        </div>
        <div class="quantity-stepper">
          <button class="stepper-button" type="button" :disabled="product.quantity <= 1" aria-label="减少商品数量"
            @click="emit('decrease', product.id)">
            −
          </button>
          <span class="quantity">{{ product.quantity }}</span>
          <button class="stepper-button" type="button" aria-label="增加商品数量" @click="emit('increase', product.id)">
            +
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.cart-product {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 20px;
}

.product-image {
  flex: 0 0 88px;
  width: 88px;
  height: 78px;
  border-radius: 6px;
  object-fit: cover;
  background: #f2f3f5;
}

.product-content {
  flex: 1;
  min-width: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 0;
}

.product-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 5px;
  margin-right: 2px;
  border-radius: 4px 0 4px 0;
  background: #d8843e;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  vertical-align: 1px;
}

.product-spec {
  margin: 6px 0 0;
  color: #8f8f8f;
  font-size: 12px;
  line-height: 1.4;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.price-wrap {
  min-width: 0;
  display: flex;
  align-items: baseline;
  color: #f4342d;
}

.currency {
  font-size: 13px;
  font-weight: 700;
}

.price {
  margin-left: 2px;
  font-size: 22px;
  line-height: 1;
}

.origin-price {
  margin-left: 10px;
  color: #777;
  font-size: 12px;
  text-decoration: line-through;
}

.quantity-stepper {
  flex: 0 0 auto;
  height: 30px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #d9dce1;
  border-radius: 9px;
  overflow: hidden;
  background: #fff;
}

.stepper-button {
  width: 28px;
  height: 100%;
  border: 0;
  background: #fff;
  font-size: 17px;
  line-height: 1;

  &:disabled {
    color: #c7c7c7;
  }
}

.quantity {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-inline: 1px solid #edf0f3;
  font-size: 14px;
}
</style>
