<script setup>
import { computed, ref } from 'vue'

defineOptions({
  name: 'BuyCart',
})
const cartList = ref([
  { id: 1, name: 'ew1', price: 20, quantity: 1 },
  { id: 2, name: '红烧肉', price: 35, quantity: 2 },
])

function updateQuantity(item, delta) {
  item.quantity += delta
  if (item.quantity < 0)
    item.quantity = 0
}

function clearCart() {
  cartList.value = []
}

/**
 * 模拟真实项目数据（以后你肯定会接 pinia / 接口）
 */
const totalPrice = 0
const deliveryFee = 5
const minPrice = 20

// 是否可以下单
const canCheckout = computed(() => totalPrice >= minPrice)

// 按钮文案（真实项目一定是动态的）
const buttonText = computed(() => {
  if (totalPrice === 0)
    return `￥${minPrice}起送`
  if (!canCheckout.value)
    return `还差${minPrice - totalPrice}元起送`
  return '去结算'
})
</script>

<template>
  <div class="buycart-continer">
    <div class="buycart">
      <!-- 购物车 icon -->
      <div class="buycart__icon">
        <SvgIcon icon-name="buy-cart" class="buycart__icon-svg" />
      </div>

      <!-- 信息区域 -->
      <div class="buycart__info">
        <div class="buycart__price">
          ￥{{ totalPrice.toFixed(2) }}
        </div>
        <div class="buycart__delivery">
          配送费￥{{ deliveryFee.toFixed(2) }}
        </div>
      </div>

      <!-- 按钮 -->
      <button class="buycart__button" :class="{ 'buycart__button--active': canCheckout }">
        {{ buttonText }}
      </button>
    </div>
    <div class="cart-panel">
      <!-- 头部 -->
      <div class="cart-header">
        <h3 class="title">
          购物车
        </h3>
        <button class="clear-btn" @click="clearCart">
          <van-icon name="delete-o" />
          <span>清空</span>
        </button>
      </div>

      <!-- 列表 -->
      <ul class="cart-list">
        <li v-for="item in cartList" :key="item.id" class="cart-item">
          <div class="item-name">
            {{ item.name }}
          </div>

          <div class="item-right">
            <span class="item-price">¥{{ item.price }}</span>

            <div class="quantity-control">
              <button class="btn-minus" :disabled="item.quantity <= 0" @click="updateQuantity(item, -1)">
                <van-icon name="minus" />
              </button>
              <span class="quantity">{{ item.quantity }}</span>
              <button class="btn-plus" @click="updateQuantity(item, 1)">
                <van-icon name="plus" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================= 变量（真实项目建议全局） =================
$color-bg-dark: #3d3d3f;
$color-border: #444;
$color-text: #fff;
$color-text-secondary: rgba(255, 255, 255, 0.7);
$color-disabled: #535356;
$color-active: #38ca73;

// ================= 主体 =================
.buycart {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 47px;

  display: flex;
  align-items: center;

  padding-left: 80px;
  background: $color-bg-dark;
  z-index: 100;
}

// ================= icon =================
.buycart__icon {
  position: absolute;
  left: 10px;
  top: -16px;

  padding: 10px;
  background: $color-bg-dark;
  border: 4px solid $color-border;
  border-radius: 50%;
}

.buycart__icon-svg {
  width: 30px;
  height: 30px;
  fill: $color-text;
}

// ================= 信息 =================
.buycart__info {
  display: flex;
  flex-direction: column;
}

.buycart__price {
  color: $color-text;
  font-size: 16px;
  font-weight: 600;
}

.buycart__delivery {
  color: $color-text-secondary;
  font-size: 12px;
}

// ================= 按钮 =================
.buycart__button {
  margin-left: auto;

  min-width: 120px;
  height: 100%;
  padding: 0 12px;

  background: $color-disabled;
  color: $color-text;

  font-weight: 700;
  border: none;
}

.buycart__button--active {
  background: $color-active;
}

.cart-panel {
  background: #fff;
  border-radius: 12px 12px 0 0;
  /* max-height: 60vh; */
  /* overflow-y: auto; */
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
  background: none;
  border: none;
}

.cart-list {
  padding: 0 16px;
}

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.item-name {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff6000;
  /* 橙色价格 */
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-minus,
.btn-plus {
  width: 18px;
  height: 18px;
  border: 1px solid #3190e8;
  /* 蓝色边框 */
  border-radius: 50%;
  background: #fff;
  color: #3190e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0;
}

.quantity {
  font-size: 14px;
  color: #333;
  min-width: 20px;
  text-align: center;
}
</style>
