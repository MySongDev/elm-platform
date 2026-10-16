<script setup lang="ts">
/**
 * ⚠️ 占位页 —— 尚未实现
 *
 * 迁移来源: apps/web-user/src/views/shop/shop.vue
 * 实现批次: Batch 3 最后一批（8-12 天，最难）
 * 分包归属: pkg-shop
 * 需要登录: 是（见 config/routes.ts 的 REQUIRES_AUTH_PAGES）
 *
 * 本文件由 scripts/generate-page-placeholders.mjs 生成，用于在 Batch 1 锁定分包结构。
 * Batch 3 迁移该页时**整体替换本文件内容**。
 */
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { createAuthGuard } from '@/platform/navigation'

const routePath = ref('/pkg-shop/shop')

onLoad((options) => {
  console.log('[shop] onLoad', options)
})

// 鉴权兜底：tabBar 页不可拦截 switchTab，故用 onShow 而非 onLoad（迁移方案 E 节）
onShow(createAuthGuard('/pkg-shop/shop'))
</script>

<template>
  <view class="placeholder">
    <view class="placeholder-title">
      商家
    </view>
    <view class="placeholder-path">
      {{ routePath }}
    </view>
    <view class="placeholder-note">
      占位页 · 待 Batch 3 最后一批（8-12 天，最难） 实现
    </view>
    <view class="placeholder-source">
      源: apps/web-user/src/views/shop/shop.vue
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 占位页样式。⚠️ 单位用 rpx（375 基准，1px = 2rpx） */
.placeholder {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48rpx 32rpx;
}

.placeholder-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

.placeholder-path {
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: $blue;
  background: rgb(49 144 232 / 10%);
  border-radius: 8rpx;
}

.placeholder-note {
  font-size: 26rpx;
  color: #ff976a;
}

.placeholder-source {
  font-size: 20rpx;
  color: #999;
  word-break: break-all;
}
</style>
