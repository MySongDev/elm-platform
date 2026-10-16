<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/cart/components/CartCheckButton.vue 同源改造。
 * 差异：button/span → view（小程序 button 有默认样式重置成本高）；px → rpx；
 * ① 类不转：border 1px、::after 的 border-width 2px（勾选符号的描边粗细）。
 */
defineProps({
  checked: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: '选择',
  },
  asSpan: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])
</script>

<template>
  <view
    class="cart-check-button"
    :class="{ checked }"
    :aria-label="asSpan ? undefined : ariaLabel"
    :aria-hidden="asSpan ? 'true' : undefined"
    @click="!asSpan && emit('click')"
  />
</template>

<style lang="scss" scoped>
.cart-check-button {
  position: relative;
  display: inline-block;
  flex: 0 0 auto;
  width: 40rpx;
  height: 40rpx;
  padding: 0;
  background: #fff;
  border: 1px solid #d4d7dc; /* ① 类 border 不转 */
  border-radius: 50%;

  &.checked {
    background: #ffd12f;
    border-color: #ffd12f;

    &::after {
      position: absolute;
      top: 6rpx;
      left: 12rpx;
      width: 10rpx;
      height: 14rpx;
      content: '';
      border: solid #413f3f;
      border-width: 0 2px 2px 0; /* 勾选描边粗细，① 类不转 */
      transform: rotate(45deg);
    }
  }
}
</style>
