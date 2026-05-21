<script setup>
/** 商家头部活动条（券样式展示） */
defineProps({
  amount: [Number, String],
  title: String,
  subtitle: String,
  actionText: { type: String, default: '领' },
  color: { type: String, default: '#ff5722' },
  rightWidth: { type: Number, default: 40 }, // 右侧操作区的宽度基准
})
</script>

<template>
  <div class="coupon-container" :style="{ '--right-w': `${rightWidth}px`, '--color': color }">
    <div class="coupon-left">
      <!-- <div class="amount-group">
        <span class="symbol">¥</span>
        <span class="value">{{ title }} </span>
      </div> -->
      <div class="info">
        <div class="title">
          {{ title }}
        </div>
        <div v-if="subtitle" class="subtitle">
          {{ subtitle }}
        </div>
      </div>
    </div>

    <div class="coupon-right">
      <slot name="action">
        <span class="action-btn">{{ actionText }}</span>
      </slot>
    </div>

    <div class="divider" />
  </div>
</template>

<style lang="scss" scoped>
.coupon-container {
  display: inline-flex;
  /* 关键：根据子元素内容决定容器宽度 */
  min-width: 60px;
  height: 23px;
  background-color: var(--color);
  color: #fff;
  border-radius: 6px;
  position: relative;

  /* 底层原理：遮罩位置使用 calc 动态计算 */
  /* 缺口位置 = 总宽度 - 右侧固定宽度 */
  $notch-pos: calc(100% - var(--right-w));

  mask-image: radial-gradient(circle at $notch-pos 0, #0000 2px, #000 0),
    radial-gradient(circle at $notch-pos 100%, #0000 2px, #000 0);
  mask-composite: intersect; //多个mask的组合方式
  -webkit-mask-composite: source-in;

  .coupon-left {
    padding: 0 10px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    /* 保证文字不换行，从而撑开宽度 */

    .amount-group {
      margin-right: 12px;

      .symbol {
        font-size: 14px;
        font-weight: bold;
      }

      .value {
        font-size: 30px;
        font-weight: bold;
      }
    }

    .title {
      font-size: 14px;
      // font-weight: bold;
      color: #fff;
    }

    .subtitle {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 2px;
    }
  }

  .coupon-right {
    width: var(--right-w);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    /* 防止右侧被左侧长文字挤压 */

    .action-btn {
      font-size: 16px;
      // font-weight: bold;
      color: #fff;
    }
  }

  .divider {
    position: absolute;
    right: var(--right-w);
    top: 15%;
    bottom: 15%;
    border-left: 1px dashed rgba(255, 255, 255, 0.4);
    transform: translateX(50%);
    /* 精准对齐缺口中心 */
  }
}
</style>
