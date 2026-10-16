<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/Skeleton/ShopListSkeleton.vue 同源改造。
 *
 * ★ 本文件是议题 4 ③ 类（模板属性 px）的手工转换点之一：7 处 `width="64px"` 式属性
 * 全部改成 rpx（×2）。⚠️ 数值必须与 ShopItem 的真实渲染尺寸对齐，
 * 否则骨架屏与真实内容切换时跳动（方案议题 4 ③ 的原话）。
 */
import SkeletonBlock from './SkeletonBlock.vue'

defineProps({
  rows: {
    type: Number,
    default: 6,
  },
})
</script>

<template>
  <view
    class="shop-list-skeleton"
    aria-hidden="true"
  >
    <view
      v-for="index in rows"
      :key="index"
      class="shop-skeleton-item"
    >
      <SkeletonBlock
        width="128rpx"
        height="128rpx"
        radius="8rpx"
        class="shop-skeleton-item__avatar"
      />
      <view class="shop-skeleton-item__content">
        <view class="shop-skeleton-item__header">
          <SkeletonBlock
            width="46%"
            height="36rpx"
          />
          <SkeletonBlock
            width="104rpx"
            height="32rpx"
            radius="6rpx"
          />
        </view>
        <view class="shop-skeleton-item__row">
          <SkeletonBlock
            width="240rpx"
            height="28rpx"
          />
          <SkeletonBlock
            width="144rpx"
            height="36rpx"
            radius="6rpx"
          />
        </view>
        <view class="shop-skeleton-item__row">
          <SkeletonBlock
            width="300rpx"
            height="28rpx"
          />
          <SkeletonBlock
            width="156rpx"
            height="28rpx"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.shop-list-skeleton {
  background: #fff;
}

.shop-skeleton-item {
  display: flex;
  padding: 33rpx 18.6rpx;
  border-bottom: 0.5px solid #e2e2e2; /* 发丝线不转（① 类 border） */
}

.shop-skeleton-item__avatar {
  flex: 0 0 128rpx;
  width: 128rpx;
  height: 128rpx;
  margin-right: 20rpx;
  border-radius: 8rpx;
}

.shop-skeleton-item__content {
  flex: 1;
  min-width: 0;
}

.shop-skeleton-item__header,
.shop-skeleton-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shop-skeleton-item__header {
  margin-bottom: 28rpx;
}

.shop-skeleton-item__row {
  margin-bottom: 24rpx;
}
</style>
