<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/BaseState/BaseState.vue 同源改造。
 * 差异：
 * 1. div → view（小程序无 div）
 * 2. `<transition name="fade">` → **去掉**。小程序端 `<transition>` 不适用
 *    （页面过渡动画是平台硬限制，组件级同理），遮罩显隐直接用 v-show
 * 3. px → rpx（375 基准 ×2）
 *
 * easycom 约定：components/BaseState/BaseState.vue → 模板里可直接 <BaseState>。
 */
import DefaultEmpty from './common/DefaultEmpty.vue'
import DefaultError from './common/DefaultError.vue'
import DefaultLoading from './common/DefaultLoading.vue'

defineProps({
  state: {
    type: String,
    default: '', // '' (初始) | loading | error | empty | success
  },
})

defineEmits(['retry'])
</script>

<template>
  <view
    class="state-container"
    :class="{ 'is-active': state !== '' }"
  >
    <!-- 成功状态内容（始终渲染，通过 v-show 控制显示） -->
    <view
      v-show="state === 'success'"
      class="state-content"
    >
      <slot />
    </view>

    <!-- 覆盖层容器：当处于非成功状态且非空时显示（web-user 的 transition 已去掉） -->
    <view
      v-show="state && state !== 'success'"
      class="state-overlay"
    >
      <!-- 加载中 -->
      <view
        v-show="state === 'loading'"
        class="overlay-loading"
      >
        <slot name="loading">
          <DefaultLoading />
        </slot>
      </view>

      <!-- 错误 -->
      <view
        v-show="state === 'error'"
        class="overlay-error"
      >
        <slot name="error">
          <DefaultError @retry="$emit('retry')" />
        </slot>
      </view>

      <!-- 空数据 -->
      <view
        v-show="state === 'empty'"
        class="overlay-empty"
      >
        <slot name="empty">
          <DefaultEmpty />
        </slot>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.state-container {
  /* 默认没有任何样式，高度为 0 */
  position: relative;
}

/* 只有当状态被激活时，才赋予最小高度 */
.state-container.is-active {
  min-height: 240rpx;
}

.state-content {
  height: 100%;
}

.state-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;

  /* 现代属性：top/left/right/bottom 全为 0 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
