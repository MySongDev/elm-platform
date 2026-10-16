<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/common/BackTop/BackTop.vue 同源改造，**机制重写**。
 *
 * web-user 依赖 `useBackTop.ts`（240 行重度 DOM：document.querySelector、
 * getBoundingClientRect、window.getComputedStyle、ResizeObserver、rAF、window.scrollTo）
 * → 小程序端全部不存在，**该 composable 整体作废，不搬**。
 *
 * 小程序版的设计：组件退化为「纯展示 + 事件」，平台调用全部交给父页面：
 * - 显隐：由父页面 v-if 控制（本组件渲染即显示）。⚠️ 2026-09-29 起显隐判断
 *   上提到父页面 —— 父页面滚动监听只维护「是否超阈值」布尔（跨点才更新），
 *   不再把每帧 scrollTop 数值传进来。避免逐帧 setData 跨线程通信导致页面延迟/跳动。
 * - 回顶：组件 emit('to-top')，父页面决定怎么滚
 *   （页面级 → uni.pageScrollTo；scroll-view 级 → 受控 :scroll-top，注意同值坑先设 undefined）
 * 这样组件本身零平台依赖、零显隐逻辑，两种滚动容器模式都能用。
 *
 * ⚠️ 结构差异：web-user 的 ShopList 内部用 `<Teleport to="body">` 挂 BackTop ——
 * 小程序端**没有 Teleport**。uni-user 的 ShopList 不再内嵌 BackTop，
 * 由页面按需挂载（Batch 3 迁 msite/search 时落实）。
 *
 * ⚠️ 图标：web-user 是内联 `<svg>` 手绘上箭头（H 节指出的重复实现），
 * 这里改用 iconfont 的 backtop（icons/svg/backtop.svg 已有同图标）→ 消掉重复。
 */
import { computed } from 'vue'

const props = defineProps({
  right: {
    type: [Number, String],
    default: 32,
  },
  bottom: {
    type: [Number, String],
    default: 160,
  },
  ariaLabel: {
    type: String,
    default: '返回顶部',
  },
})

const emit = defineEmits(['to-top'])

const positionStyle = computed(() => ({
  right: typeof props.right === 'number' ? `${props.right}rpx` : props.right,
  bottom: typeof props.bottom === 'number' ? `${props.bottom}rpx` : props.bottom,
}))
</script>

<template>
  <!-- ⚠️ 无显隐指令：显隐由父组件 v-if 控制（msite 用 showBackTop 布尔，跨阈值才更新）。
       本组件渲染即显示，只负责展示与点击。 -->
  <view
    class="back-top"
    :aria-label="ariaLabel"
    :style="positionStyle"
    @click="emit('to-top')"
  >
    <slot>
      <!-- backtop 走 PNG 分支（字体分支对复合路径会压扁字形）。PNG 是图片，
           size 即图片宽高，无字体留白问题 → 取圆圈（88rpx）的一半即可，视觉居中协调 -->
      <SvgIcon
        icon-name="backtop"
        size="44rpx"
      />
    </slot>
  </view>
</template>

<style lang="scss" scoped>
.back-top {
  position: fixed;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;

  /* ⚠️ 字体图标的行框随 font-size 增大、且 glyph 上下有留白（可视箭头远小于字号），
     调大字号让可视部分填满圆圈时行框会超出 → 用 overflow:hidden 裁掉，防止顶开布局。 */
  overflow: hidden;
  color: #666;
  background: rgb(255 255 255 / 95%);
  border-radius: 50%;
  box-shadow: 0 4rpx 24rpx rgb(0 0 0 / 12%);

  /* ⚠️ backdrop-filter / will-change / translateZ 在小程序端支持有限，已移除
     （web-user 用它们做毛玻璃与合成层优化，降级为纯色半透明背景） */
  &:active {
    transform: scale(0.92);
  }
}
</style>
