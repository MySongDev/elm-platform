<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/components/ProfileCard.vue 同源改造。
 * 差异：router-link → view + navigateTo；img → image；getUploadUrl 走 platform/image；
 * px → rpx；① 类不转无（本文件 border 仅 border-radius 50%）。
 */
import { computed, ref, watch } from 'vue'

import { profileCardConfig } from '@/config/profileConfig'
import { getUploadUrl } from '@/platform/image'
import { navigateTo } from '@/platform/navigation'

const props = defineProps({
  isLoggedIn: Boolean,
  userName: String,
  userAvatar: String,
  profileLink: String,
  displayName: String,
  displayDesc: Object,
})

const avatarUrl = computed(() => getUploadUrl(props.userAvatar))
const imageFailed = ref(false)
watch(avatarUrl, () => {
  imageFailed.value = false
})

function goProfile(link) {
  if (link)
    navigateTo(link)
}
</script>

<template>
  <view class="profile-card">
    <view
      class="profile-card_link"
      @click="goProfile(profileLink)"
    >
      <image
        v-if="isLoggedIn && avatarUrl && !imageFailed"
        class="profile-card_avatar"
        :src="avatarUrl"
        mode="aspectFill"
        @error="imageFailed = true"
      />
      <view v-else class="profile-card_avatar profile-card_avatar--default">
        <SvgIcon icon-name="avatar-default" class="profile-card_default-icon" color="#fff" />
      </view>

      <view class="profile-card_info">
        <text class="profile-card_name">
          {{ displayName }}
        </text>
        <view
          v-if="displayDesc"
          class="profile-card_desc"
        >
          <SvgIcon
            v-if="displayDesc.icon"
            :icon-name="displayDesc.icon"
            class="icon_mobile"
            color="#fff"
          />
          <text>{{ displayDesc.text }}</text>
        </view>
      </view>
      <SvgIcon
        :icon-name="profileCardConfig.arrowIcon"
        class="profile-card_arrow"
        color="#fff"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-card {
  width: 100%;
  height: 180rpx;
  background: $blue;

  &_link {
    display: flex;
    align-items: center;
    padding: 32rpx;
    color: inherit;
  }

  &_avatar {
    flex-shrink: 0;
    width: 116rpx;
    height: 116rpx;
    border-radius: 50%;

    &--default {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgb(255 255 255 / 20%);
    }
  }

  &_default-icon {
    font-size: 100rpx;
  }

  &_info {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    margin-left: 24rpx;
    overflow: hidden;
  }

  &_name {
    @include text-ellipsis;

    font-size: 37.5rpx;
    font-weight: 500;
    color: $ff;
  }

  &_desc {
    display: flex;
    align-items: center;
    margin-top: 8rpx;
    font-size: 26rpx;
    color: $ff;

    /* ⚠️ 标签级 class（落在宿主节点），不是 icon-class —— 见 SvgIcon.vue 头部契约。
       web-user 原文 width:10px;height:16px 是 <svg> 盒子的瘦长比例；字体图标的字形
       大小只由 font-size 决定，故按高度取 16px→32rpx，20rpx 的宽度无法等价复现 */
    .icon_mobile {
      margin-right: 4rpx;
      font-size: 32rpx;
      line-height: 1;
      vertical-align: bottom; /* ① 类不转 */
    }
  }

  &_arrow {
    /* ⚠️ 标签级 class（宿主节点即 flex item，故 flex-shrink 在此有效）。
       web-user 是 @include wh(16px, 16px) → 32rpx；字体图标 1em 即边长 */
    flex-shrink: 0;
    font-size: 32rpx;
    line-height: 1;
  }
}
</style>
