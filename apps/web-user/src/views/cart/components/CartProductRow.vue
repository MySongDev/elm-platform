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
  gap: 12px;
  align-items: center;
  padding-bottom: 20px;
}

.product-image {
  flex: 0 0 88px;
  width: 88px;
  height: 78px;
  object-fit: cover;
  background: #f2f3f5;
  border-radius: 6px;
}

.product-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-self: stretch;
  justify-content: space-between;
  min-width: 0;
  padding: 2px 0;
}

.product-name {
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 5px;
  margin-right: 2px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  vertical-align: 1px;
  background: #d8843e;
  border-radius: 4px 0;
}

.product-spec {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #8f8f8f;
}

.product-bottom {
  display: flex;
  gap: 10px;
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
  font-size: 12px;
  color: #777;
  text-decoration: line-through;
}

.quantity-stepper {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  height: 30px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d9dce1;
  border-radius: 9px;
}

.stepper-button {
  width: 28px;
  height: 100%;
  font-size: 17px;
  line-height: 1;
  background: #fff;
  border: 0;

  &:disabled {
    color: #c7c7c7;
  }
}

.quantity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 14px;
  border-inline: 1px solid #edf0f3;
}
</style>
