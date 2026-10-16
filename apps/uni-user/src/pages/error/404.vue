<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/error/404.vue 同源改造（纯 CSS 插画页，无数据依赖）。
 *
 * 差异：
 * 1. `router.push('/')` → `reLaunchToTab()`（方案 E 节死链修正：404.vue:11）
 * 2. `router.back()` → `navigateBack()`（内部已处理「首页调用失败 → 降级 switchTab」）
 * 3. div/span/h1/p/button → view/text；px → rpx（×2）
 *    ⚠️ ① 类不转：letter-spacing -2px、ghost 按钮的 border 1px
 * 4. ⚠️ 渐变文字（background-clip: text + text-fill-color: transparent）在小程序端
 *    支持有限 → 保留渐变但给 color 兜底（不支持时显示实色，不裂）
 * 5. CSS animation（float/twinkle）小程序端支持，保留
 *
 * ⚠️ 小程序端**没有 404 兜底路由机制**（方案 E 节）：只能跳到 pages.json 声明过的页面，
 * 跳错路径直接报错。本页仍保留，但只供业务逻辑**主动跳转**（如订单不存在），
 * 不再承担路由兜底职责。
 */
import { navigateBack, reLaunchToTab } from '@/platform/navigation'

function goHome() {
  reLaunchToTab()
}

function goBack() {
  navigateBack()
}
</script>

<template>
  <view class="not-found">
    <view class="not-found__content">
      <view class="not-found__illustration">
        <view class="not-found__planet">
          <view class="not-found__crater" />
          <view class="not-found__crater not-found__crater--sm" />
        </view>
        <view class="not-found__astronaut">
          <view class="not-found__helmet" />
          <view class="not-found__body" />
        </view>
        <view class="not-found__stars">
          <view />
          <view />
          <view />
          <view />
          <view />
        </view>
      </view>

      <text class="not-found__code">
        404
      </text>
      <text class="not-found__title">
        页面走丢了
      </text>
      <text class="not-found__desc">
        你访问的页面已不存在或被移除
      </text>

      <view class="not-found__actions">
        <view
          class="not-found__btn not-found__btn--primary"
          @click="goHome"
        >
          回到首页
        </view>
        <view
          class="not-found__btn not-found__btn--ghost"
          @click="goBack"
        >
          返回上页
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.not-found {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
  background: #0f0f1a;

  &__content {
    position: relative;
    z-index: 1;
    padding: 80rpx 48rpx;
    text-align: center;
  }

  &__illustration {
    position: relative;
    width: 400rpx;
    height: 400rpx;
    margin: 0 auto 64rpx;
  }

  &__planet {
    position: absolute;
    bottom: 40rpx;
    left: 50%;
    width: 240rpx;
    height: 240rpx;
    background: linear-gradient(135deg, #6c63ff 0%, #3b3486 100%);
    border-radius: 50%;
    box-shadow: 0 40rpx 120rpx rgb(108 99 255 / 30%);
    transform: translateX(-50%);
  }

  &__crater {
    position: absolute;
    top: 60rpx;
    right: 50rpx;
    width: 60rpx;
    height: 60rpx;
    background: rgb(0 0 0 / 15%);
    border-radius: 50%;

    &--sm {
      top: 120rpx;
      right: 110rpx;
      width: 32rpx;
      height: 32rpx;
    }
  }

  &__astronaut {
    position: absolute;
    top: 20rpx;
    left: 50%;
    transform: translateX(-30%);
    animation: float 4s ease-in-out infinite;
  }

  &__helmet {
    position: relative;
    width: 56rpx;
    height: 56rpx;
    background: #e8e8e8;
    border: 3px solid #ccc; /* ① 类 border 不转 */
    border-radius: 50%;

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 32rpx;
      height: 24rpx;
      content: '';
      background: linear-gradient(135deg, #87ceeb, #4a9eff);
      border-radius: 16rpx;
      transform: translate(-50%, -50%);
    }
  }

  &__body {
    width: 44rpx;
    height: 60rpx;
    margin: 4rpx auto 0;
    background: #e8e8e8;
    border-radius: 16rpx;
  }

  &__stars view {
    position: absolute;
    width: 6rpx;
    height: 6rpx;
    background: #fff;
    border-radius: 50%;
    animation: twinkle 2s ease-in-out infinite;

    &:nth-child(1) {
      top: 30rpx;
      left: 40rpx;
      animation-delay: 0s;
    }

    &:nth-child(2) {
      top: 80rpx;
      right: 30rpx;
      animation-delay: 0.4s;
    }

    &:nth-child(3) {
      top: 10rpx;
      right: 80rpx;
      animation-delay: 0.8s;
    }

    &:nth-child(4) {
      bottom: 120rpx;
      left: 20rpx;
      animation-delay: 1.2s;
    }

    &:nth-child(5) {
      right: 60rpx;
      bottom: 160rpx;
      animation-delay: 1.6s;
    }
  }

  &__code {
    display: block;
    margin: 0 0 16rpx;
    font-size: 160rpx;
    font-weight: 800;
    line-height: 1;
    color: #6c63ff; /* 渐变文字不支持时的兜底色 */
    letter-spacing: -2px; /* ① 类 letter-spacing 不转 */
    background: linear-gradient(135deg, #6c63ff, #e942f5);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__title {
    display: block;
    margin: 0 0 16rpx;
    font-size: 44rpx;
    font-weight: 600;
    color: #e8e8f0;
  }

  &__desc {
    display: block;
    margin: 0 0 80rpx;
    font-size: 28rpx;
    color: #8888a0;
  }

  &__actions {
    display: flex;
    gap: 24rpx;
    justify-content: center;
  }

  &__btn {
    padding: 24rpx 56rpx;
    font-size: 30rpx;
    font-weight: 500;
    border-radius: 24rpx;
    transition: all 0.2s ease;

    &--primary {
      color: #fff;
      background: linear-gradient(135deg, #6c63ff, #5a52e0);
      box-shadow: 0 8rpx 40rpx rgb(108 99 255 / 40%);

      &:active {
        transform: scale(0.96);
      }
    }

    &--ghost {
      color: #b0b0c8;
      background: rgb(255 255 255 / 6%);
      border: 1px solid rgb(255 255 255 / 10%); /* ① 类 border 不转 */

      &:active {
        transform: scale(0.96);
      }
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateX(-30%) translateY(0);
  }

  50% {
    transform: translateX(-30%) translateY(-24rpx);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.4);
  }
}
</style>
