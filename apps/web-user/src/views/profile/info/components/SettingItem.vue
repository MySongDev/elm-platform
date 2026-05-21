<script setup>
defineProps({
  label: String,
  value: String,
  to: [String, Object],
  icon: String,
  iconColor: String,
})
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="setting-item">
    <div class="setting-item_left">
      <SvgIcon v-if="icon" :icon-name="icon" icon-class="setting-item_icon" :color="iconColor" />
      <span>{{ label }}</span>
    </div>
    <div class="setting-item_right">
      <span v-if="value" class="setting-item_value">{{ value }}</span>
      <slot />
      <SvgIcon icon-name="arrow-right" icon-class="setting-item_arrow" color="#d8d8d8" />
    </div>
  </component>
</template>

<style lang="scss" scoped>
.setting-item {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $e4;
  background: #fff;

  &_left {
    display: flex;
    align-items: center;

    span {
      font-size: 14px;
      color: #333;
    }
  }

  &_icon {
    @include wh(20px, 18px);
    margin-right: 6px;
  }

  &_right {
    display: flex;
    align-items: center;
  }

  &_value {
    margin-right: 4px;
    font-size: 14px;
    color: #999;
  }

  &_arrow {
    @include wh(16px, 16px);
  }
}
</style>
