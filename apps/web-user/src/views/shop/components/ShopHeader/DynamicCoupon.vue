<script setup>
/** 商家头部活动条（券样式展示） */
defineProps({
  amount: [Number, String],
  title: String,
  subtitle: String,
  actionText: {
    type: String,
    default: '领',
  },
  color: {
    type: String,
    default: '#ff5722',
  },
  rightWidth: {
    type: Number,
    default: 40,
  }, // 右侧操作区的宽度基准
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
  /* 底层原理：遮罩位置使用 calc 动态计算 */

  /* 缺口位置 = 总宽度 - 右侧固定宽度 */
  $notch-pos: calc(100% - var(--right-w));

  position: relative;
  display: inline-flex;

  /* 关键：根据子元素内容决定容器宽度 */
  min-width: 60px;
  height: 23px;
  color: #fff;
  background-color: var(--color);
  border-radius: 6px;
  mask-image: radial-gradient(circle at $notch-pos 0, #0000 2px, #000 0),
    radial-gradient(circle at $notch-pos 100%, #0000 2px, #000 0);
  mask-composite: intersect; // 多个mask的组合方式
  mask-composite: source-in;

  .coupon-left {
    display: flex;
    align-items: center;
    padding: 0 10px;
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
      margin-top: 2px;
      font-size: 11px;
      opacity: 0.8;
    }
  }

  .coupon-right {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: var(--right-w);

    /* 防止右侧被左侧长文字挤压 */

    .action-btn {
      font-size: 16px;

      // font-weight: bold;
      color: #fff;
    }
  }

  .divider {
    position: absolute;
    top: 15%;
    right: var(--right-w);
    bottom: 15%;
    border-left: 1px dashed rgb(255 255 255 / 40%);
    transform: translateX(50%);

    /* 精准对齐缺口中心 */
  }
}
</style>
