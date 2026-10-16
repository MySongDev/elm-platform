<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/components/ProfileNav.vue 同源改造。
 * 差异：router-link → view @click + navigateTo；nav/span → view/text；
 * ★ D2 置灰同 ProfileStats（disabled → toast「敬请期待」+ 去色）。
 */
import { showToast } from '@/platform/feedback'
import { navigateTo } from '@/platform/navigation'

defineProps({
  groups: {
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
  <view
    v-for="(group, index) in groups"
    :key="index"
    class="profile-nav"
    :class="{ 'last-nav': index === groups.length - 1 }"
  >
    <view
      v-for="item in group"
      :key="item.title"
      class="nav-link"
      :class="{ disabled: item.disabled }"
      @click="onTap(item)"
    >
      <!-- <SvgIcon
        :icon-name="item.icon"
        :color="item.color"
      /> -->
      <text class="nav-title">
        {{ item.title }}
      </text>
      <SvgIcon
        icon-name="arrow-right"
        icon-class="svg-right"
        color="#ccc"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-nav {
  padding: 0 24rpx;
  margin-top: 20rpx;
  background: $ff;

  .nav-link {
    display: flex;
    align-items: center;
    justify-content: start;
    line-height: 90rpx;
    border-bottom: 1px solid $e4; /* ① 类 border 不转 */

    /* ★ D2 置灰 */
    &.disabled {
      filter: grayscale(1);
      opacity: 0.4;
    }

    .nav-title {
      flex: 1;
      margin-left: 10rpx;
    }
  }

  .nav-link:last-child {
    border: none;
  }
}

.last-nav {
  height: 180rpx;
}
</style>
