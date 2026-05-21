<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  selectedSpecs: {
    type: Object,
    default: () => ({}),
  },
})

/**
 * 当前价格
 */
const currentPrice = computed(() => props.config.price)

/**
 * 折扣文本
 */
const discountText = computed(() => {
  if (!props.config.originalPrice)
    return ''
  const discount = Math.round((props.config.price / props.config.originalPrice) * 10)
  return `${discount}折`
})

/**
 * 商品图片（实际项目中从接口获取）
 */
const productImage = computed(() => {
  // 根据配置动态返回不同尺寸的图片
  return props.config.ui.imagePosition === 'left'
    ? '/images/product-side.png'
    : '/images/product-top.png'
})

/**
 * 图片位置样式类
 */
const imagePositionClass = computed(() => ({
  'image-left': props.config.ui.imagePosition === 'left',
  'image-top': props.config.ui.imagePosition === 'top',
}))

/**
 * 头部样式
 */
const headerStyle = computed(() => ({
  '--theme-color': props.config.ui.themeColor || '#FF6B6B',
}))

/**
 * 是否有已选内容
 */
const hasSelections = computed(() => {
  return Object.keys(props.selectedSpecs).length > 0
})

/**
 * 已选规格文本
 */
const selectedText = computed(() => {
  const texts = []
  props.config.specs?.forEach((spec) => {
    const selectedId = props.selectedSpecs[spec.id]
    const option = spec.options?.find(o => o.id === selectedId)
    if (option) {
      texts.push(option.name)
    }
  })
  return texts.join(' + ')
})
</script>

<template>
  <div class="specs-header" :style="headerStyle">
    <!-- 商品图片 -->
    <div class="product-image" :class="imagePositionClass">
      <img :src="productImage" alt="商品图片">

      <!-- 折扣标签 -->
      <span v-if="config.ui.showDiscount && config.originalPrice" class="discount-badge">
        {{ discountText }}
      </span>

      <!-- 主题标签 -->
      <span v-if="config.ui.showBadge" class="theme-badge" :style="{ background: config.ui.themeColor }">
        {{ config.ui.badgeText }}
      </span>
    </div>

    <!-- 价格信息 -->
    <div class="price-info">
      <div class="current-price">
        <span class="currency">¥</span>
        <span class="amount">{{ currentPrice }}</span>
      </div>

      <div v-if="config.ui.showOriginalPrice" class="original-price">
        ¥{{ config.originalPrice }}
      </div>

      <div v-if="config.ui.showServings" class="servings">
        {{ config.servings }}
      </div>
    </div>

    <!-- 已选规格展示 -->
    <div v-if="hasSelections" class="selected-info">
      已选: {{ selectedText }}
    </div>
  </div>
</template>

<style scoped>
.specs-header {
  padding: 16px;
  position: relative;
}

.product-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.product-image.image-left {
  width: 120px;
  height: 120px;
  float: left;
  margin-right: 16px;
}

.product-image.image-top {
  width: 100%;
  height: 200px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #FF4D4F;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.theme-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.price-info {
  padding-left: 136px;
}

.image-top .price-info {
  padding-left: 0;
  margin-top: 12px;
}

.current-price {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 14px;
  color: #FF4D4F;
  font-weight: 600;
}

.amount {
  font-size: 28px;
  color: #FF4D4F;
  font-weight: 700;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-top: 4px;
}

.servings {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.selected-info {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
}
</style>
