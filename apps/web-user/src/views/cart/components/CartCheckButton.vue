<script setup>
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
  <span v-if="asSpan" class="cart-check-button" :class="{ checked }" aria-hidden="true" />
  <button v-else class="cart-check-button" :class="{ checked }" type="button" :aria-label="ariaLabel"
    @click="emit('click')" />
</template>

<style lang="scss" scoped>
.cart-check-button {
  width: 20px;
  height: 20px;
  border: 1px solid #d4d7dc;
  border-radius: 50%;
  background: #fff;
  padding: 0;
  position: relative;
  display: inline-block;
  flex: 0 0 auto;

  &.checked {
    border-color: #ffd12f;
    background: #ffd12f;

    &::after {
      content: '';
      position: absolute;
      left: 6px;
      top: 3px;
      width: 5px;
      height: 7px;
      border: solid #413f3f;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
}
</style>
