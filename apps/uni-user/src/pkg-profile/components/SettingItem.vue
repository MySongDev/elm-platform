<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/info/components/SettingItem.vue 同源改造。
 *
 * 差异：
 * 1. `<router-link :to>` → `@click` + `navigateTo`（uni-app 没有 router-link；
 *    跳转走 platform/navigation 收口，自动处理 tabBar/普通页区别）
 * 2. 组件 → view/text；SvgIcon 的尺寸写法遵守 007 坑 17-20 的契约：
 *    尺寸/间距/布局用**标签级 class + font-size**，颜色用 color prop，
 *    icon-class 只当语义标记
 * 3. px → rpx
 */
import { navigateTo } from '@/platform/navigation'

const props = defineProps({
  label: String,
  value: String,
  to: String,
  icon: String,
  iconColor: String,
})

function go() {
  if (props.to)
    navigateTo(props.to)
}
</script>

<template>
  <view class="setting-item" @click="go">
    <view class="setting-item_left">
      <SvgIcon
        v-if="icon"
        :icon-name="icon"
        :color="iconColor"
        class="setting-item_icon"
      />
      <text class="setting-item_label">
        {{ label }}
      </text>
    </view>
    <view class="setting-item_right">
      <text v-if="value" class="setting-item_value">
        {{ value }}
      </text>
      <slot />
      <SvgIcon
        icon-name="arrow-right"
        class="setting-item_arrow"
        color="#d8d8d8"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #fff;
  border-bottom: 2rpx solid $e4;

  &_left {
    display: flex;
    align-items: center;

    .setting-item_label {
      font-size: 28rpx;
      color: #333;
    }
  }

  /* ⚠️ 标签级 class（宿主节点），font-size 决定字体图标大小（007 坑 17-20） */
  .setting-item_icon {
    margin-right: 12rpx;
    font-size: 40rpx; // 原 wh(20px,18px) → 高度 18px=36rpx，字形按高度语义取 36rpx；
    // 原 20px 宽是 svg 盒子拉宽结果，字体图标是正方形栅格，按高度 36rpx 接受宽高比偏差（同 .icon_mobile 的处置口径）
  }

  &_right {
    display: flex;
    align-items: center;
  }

  .setting-item_value {
    margin-right: 8rpx;
    font-size: 28rpx;
    color: #999;
  }

  .setting-item_arrow {
    font-size: 32rpx; // 原 wh(16px,16px) → 16px = 32rpx
  }
}
</style>
