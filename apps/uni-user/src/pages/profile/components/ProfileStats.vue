<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/components/ProfileStats.vue 同源改造。
 *
 * ★ E 节点名的改造点：web-user 用 `<router-link v-slot="{ navigate }" :to="item.to" custom>`
 * —— 这种 custom + v-slot 写法在 uni-app **完全没有对等物**，改成普通 view @click。
 *
 * ★ D2 置灰：item.disabled 时不跳转，toast「敬请期待」+ 降低不透明度/去色。
 */
import { showToast } from '@/platform/feedback'
import { navigateTo } from '@/platform/navigation'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

function onTap(item) {
  if (item.disabled) {
    showToast('敬请期待')
    return
  }
  if (item.to)
    navigateTo(item.to)
}
</script>

<template>
  <view class="info-data">
    <view class="info-data_list">
      <view
        v-for="item in items"
        :key="item.label"
        class="info-data_item"
        :class="{ disabled: item.disabled }"
        @click="onTap(item)"
      >
        <text class="info-data_item_top">
          <text
            class="info-data_value"
            :style="{ color: item.color }"
          >
            {{ item.value }}
          </text>{{ item.unit }}
        </text>
        <text class="info-data_item_bottom">
          {{ item.label }}
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.info-data {
  width: 100%;
  height: 174rpx;
  background: $ff;

  &_list {
    display: flex;
  }

  &_item {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    height: 174rpx;
    text-align: center;
    border-right: 1px solid $e4; /* ① 类 border 不转 */

    /* ★ D2 置灰：去色 + 降不透明度 */
    &.disabled {
      filter: grayscale(1);
      opacity: 0.4;
    }

    &_top {
      font-size: 24rpx;
    }

    .info-data_value {
      font-size: 56rpx;
      font-weight: 700;
    }

    &_bottom {
      margin-top: 12rpx;
      font-size: 28rpx;
      color: #666;
    }

    &:last-child {
      border-right: none;
    }
  }
}
</style>
