<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/StarRating.vue 同源改造，**交互分支已移除**。
 *
 * 移除依据（实测调用面，非主观裁剪）：
 * 全库唯一调用方 `ShopList/ShopItem.vue:71` 只传 `:model-value`（只读展示），
 * **零处**传 readonly=false 或监听 update:modelValue → 交互路径是死代码。
 *
 * 交互分支在小程序端本来也站不住（三处平台硬限制）：
 * 1. `useTemplateRef` 是 **Vue 3.5 API**，uni-user 锁 vue 3.4.21，不存在
 * 2. `getBoundingClientRect()` 小程序端要换 createSelectorQuery（异步）
 * 3. mousemove/mouseleave 小程序端无鼠标事件
 * 若将来真要可交互评分，按「touch + createSelectorQuery 异步算偏移」重做，不是搬代码。
 * 届时再补 readonly/precision 两个 prop（现在不保留死 prop）。
 *
 * 保留的视觉机制：灰底星 + 高亮层按百分比裁宽（width 由 :style 内联给，
 * 替代 web-user 的 `v-bind(displaypercent)` —— 内联 style 比 CSS v-bind 在小程序端更稳）。
 */
import { computed } from 'vue'

const props = defineProps({
  max: {
    type: Number,
    default: 5,
  },
})

const rating = defineModel({
  type: Number,
  default: 0,
})

const displayPercent = computed(() => `${((rating.value || 0) / props.max) * 100}%`)
</script>

<template>
  <view class="star-wrap">
    <view class="star">
      <!-- 灰色底 -->
      <view class="star-bg">
        <SvgIcon
          v-for="num in max"
          :key="num"
          icon-name="star"
        />
      </view>
      <!-- 高亮层：按评分百分比裁宽 -->
      <view
        class="star-active"
        :style="{ width: displayPercent }"
      >
        <SvgIcon
          v-for="num in max"
          :key="num"
          icon-name="star"
        />
      </view>
    </view>
    <text class="rating">
      {{ rating }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.star-wrap {
  display: inline-flex;
  align-items: center;
}

.star {
  position: relative;
  display: inline-block;
  font-size: 28rpx;
  user-select: none;
}

.star-bg {
  color: #ddd;
}

.star-active {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  color: #f7ba2a;
  white-space: nowrap;
  pointer-events: none;
  transition: width 0.35s ease;
}

.rating {
  display: inline-block;
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #f7ba2a;
}
</style>
