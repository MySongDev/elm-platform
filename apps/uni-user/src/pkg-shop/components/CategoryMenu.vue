<script setup>
/**
 * 左侧分类栏。
 *
 * ⚠️ 与 web-user CategoryMenu.vue 的差异：
 * 1. 滚动容器从「div overflow:auto」换成 scroll-view：小程序里普通 view 不能独立滚动
 * 2. 「激活项自动滚到可视区中央」从 getBoundingClientRect + scrollTo 换成
 *    scroll-into-view（小程序原生能力，无需异步测量）；id 加 cat- 前缀，
 *    因为 scroll-into-view 的值必须是合法 id（纯数字 id 在部分基础库不生效）
 * 3. 分类图标不渲染：后端 toFoodCategoryResponse 有 icon_url 字段但上游数据
 *    基本为空，美团左栏也是纯文字；真出现图标需求再补
 */
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <scroll-view
    class="category-menu"
    scroll-y
    :scroll-into-view="activeId != null ? `cat-${activeId}` : ''"
    :scroll-with-animation="true"
  >
    <view
      v-for="cat in categories"
      :id="`cat-${cat.id}`"
      :key="cat.id"
      class="cat-item"
      :class="{ active: String(activeId) === String(cat.id) }"
      @click="emit('select', cat.id)"
    >
      <text class="cat-name">
        {{ cat.name }}
      </text>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.category-menu {
  height: 100%;
  background: #f5f5f5;
}

.cat-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 12rpx;
  font-size: 24rpx;
  line-height: 1.3;
  color: #666;

  &.active {
    font-weight: 700;
    color: #111920;
    background: #fff;

    /* 美团式左侧高亮条；位置语义同 web-user 的 ::before */
    &::before {
      position: absolute;
      top: 30%;
      left: 0;
      width: 6rpx;
      height: 40%;
      content: '';
      background: #ffbd27;
      border-radius: 0 6rpx 6rpx 0;
    }
  }
}

.cat-name {
  text-align: center;
  word-break: break-all;
}
</style>
