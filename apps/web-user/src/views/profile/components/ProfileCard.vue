<script setup>
import { IMAGE_BASE_URL } from '@/config'
import { profileCardConfig } from '@/config/profileConfig'

defineProps({
  isLoggedIn: Boolean,
  userName: String,
  userAvatar: String,
  profileLink: String,
  displayName: String,
  displayDesc: Object,
})
</script>

<template>
  <div class="profile-card">
    <router-link :to="profileLink" class="profile-card_link">
      <img v-show="isLoggedIn" class="profile-card_avatar" :src="IMAGE_BASE_URL + userAvatar">

      <div class="profile-card_info">
        <span class="profile-card_name">{{ displayName }}</span>
        <span v-if="displayDesc" class="profile-card_desc">
          <svgIcon v-if="displayDesc.icon" :icon-name="displayDesc.icon" icon-class="icon_mobile" color="#fff" />
          {{ displayDesc.text }}
        </span>
      </div>
      <svgIcon :icon-name="profileCardConfig.arrowIcon" icon-class="profile-card_arrow" color="#fff" />
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.profile-card {
  background: $blue;
  width: 100%;
  height: 90px;

  &_link {
    display: flex;
    align-items: center;
    padding: 16px;
    color: inherit;
  }

  &_avatar {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &_info {
    flex: 1;
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  &_name {
    font-size: 18.75px;
    font-weight: 500;
    @include text-ellipsis();
    color: $ff;
  }

  &_desc {
    margin-top: 4px;
    font-size: 13px;
    color: $ff;

    .icon_mobile {
      width: 10px;
      height: 16px;
      margin-right: 2px;
      vertical-align: bottom;
    }
  }

  &_arrow {
    @include wh(16px, 16px);
    flex-shrink: 0;
  }
}
</style>
