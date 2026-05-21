<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'BuyCart',
})

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
</style>
