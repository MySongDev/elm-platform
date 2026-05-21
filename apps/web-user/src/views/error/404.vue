<script setup>
import { useRouter } from 'vue-router'

defineOptions({
  name: 'NotFound',
})

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <div class="not-found__illustration">
        <div class="not-found__planet">
          <div class="not-found__crater" />
          <div class="not-found__crater not-found__crater--sm" />
        </div>
        <div class="not-found__astronaut">
          <div class="not-found__helmet" />
          <div class="not-found__body" />
        </div>
        <div class="not-found__stars">
          <span /><span /><span /><span /><span />
        </div>
      </div>

      <h1 class="not-found__code">
        404
      </h1>
      <p class="not-found__title">
        页面走丢了
      </p>
      <p class="not-found__desc">
        你访问的页面已不存在或被移除
      </p>

      <div class="not-found__actions">
        <button class="not-found__btn not-found__btn--primary" @click="goHome">
          回到首页
        </button>
        <button class="not-found__btn not-found__btn--ghost" @click="goBack">
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f1a;
  overflow: hidden;
  position: relative;

  &__content {
    text-align: center;
    padding: 40px 24px;
    position: relative;
    z-index: 1;
  }

  &__illustration {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto 32px;
  }

  &__planet {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6c63ff 0%, #3b3486 100%);
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 20px 60px rgba(108, 99, 255, 0.3);
  }

  &__crater {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.15);
    position: absolute;
    top: 30px;
    right: 25px;

    &--sm {
      width: 16px;
      height: 16px;
      top: 60px;
      right: 55px;
    }
  }

  &__astronaut {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-30%);
    animation: float 4s ease-in-out infinite;
  }

  &__helmet {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e8e8e8;
    border: 3px solid #ccc;
    position: relative;

    &::after {
      content: '';
      width: 16px;
      height: 12px;
      border-radius: 8px;
      background: linear-gradient(135deg, #87ceeb, #4a9eff);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  &__body {
    width: 22px;
    height: 30px;
    background: #e8e8e8;
    border-radius: 8px;
    margin: 2px auto 0;
  }

  &__stars span {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #fff;
    animation: twinkle 2s ease-in-out infinite;

    &:nth-child(1) {
      top: 15px;
      left: 20px;
      animation-delay: 0s;
    }

    &:nth-child(2) {
      top: 40px;
      right: 15px;
      animation-delay: 0.4s;
    }

    &:nth-child(3) {
      top: 5px;
      right: 40px;
      animation-delay: 0.8s;
    }

    &:nth-child(4) {
      bottom: 60px;
      left: 10px;
      animation-delay: 1.2s;
    }

    &:nth-child(5) {
      bottom: 80px;
      right: 30px;
      animation-delay: 1.6s;
    }
  }

  &__code {
    font-size: 80px;
    font-weight: 800;
    background: linear-gradient(135deg, #6c63ff, #e942f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px;
    line-height: 1;
    letter-spacing: -2px;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #e8e8f0;
    margin: 0 0 8px;
  }

  &__desc {
    font-size: 14px;
    color: #8888a0;
    margin: 0 0 40px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  &__btn {
    padding: 12px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;

    &--primary {
      background: linear-gradient(135deg, #6c63ff, #5a52e0);
      color: #fff;
      box-shadow: 0 4px 20px rgba(108, 99, 255, 0.4);

      &:active {
        transform: scale(0.96);
      }
    }

    &--ghost {
      background: rgba(255, 255, 255, 0.06);
      color: #b0b0c8;
      border: 1px solid rgba(255, 255, 255, 0.1);

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
    transform: translateX(-30%) translateY(-12px);
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
