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
    padding: 40px 24px;
    text-align: center;
  }

  &__illustration {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto 32px;
  }

  &__planet {
    position: absolute;
    bottom: 20px;
    left: 50%;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #6c63ff 0%, #3b3486 100%);
    border-radius: 50%;
    box-shadow: 0 20px 60px rgb(108 99 255 / 30%);
    transform: translateX(-50%);
  }

  &__crater {
    position: absolute;
    top: 30px;
    right: 25px;
    width: 30px;
    height: 30px;
    background: rgb(0 0 0 / 15%);
    border-radius: 50%;

    &--sm {
      top: 60px;
      right: 55px;
      width: 16px;
      height: 16px;
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
    position: relative;
    width: 28px;
    height: 28px;
    background: #e8e8e8;
    border: 3px solid #ccc;
    border-radius: 50%;

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 12px;
      content: '';
      background: linear-gradient(135deg, #87ceeb, #4a9eff);
      border-radius: 8px;
      transform: translate(-50%, -50%);
    }
  }

  &__body {
    width: 22px;
    height: 30px;
    margin: 2px auto 0;
    background: #e8e8e8;
    border-radius: 8px;
  }

  &__stars span {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #fff;
    border-radius: 50%;
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
      right: 30px;
      bottom: 80px;
      animation-delay: 1.6s;
    }
  }

  &__code {
    margin: 0 0 8px;
    font-size: 80px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -2px;
    background: linear-gradient(135deg, #6c63ff, #e942f5);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 600;
    color: #e8e8f0;
  }

  &__desc {
    margin: 0 0 40px;
    font-size: 14px;
    color: #8888a0;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  &__btn {
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    border-radius: 12px;
    transition: all 0.2s ease;

    &--primary {
      color: #fff;
      background: linear-gradient(135deg, #6c63ff, #5a52e0);
      box-shadow: 0 4px 20px rgb(108 99 255 / 40%);

      &:active {
        transform: scale(0.96);
      }
    }

    &--ghost {
      color: #b0b0c8;
      background: rgb(255 255 255 / 6%);
      border: 1px solid rgb(255 255 255 / 10%);

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
