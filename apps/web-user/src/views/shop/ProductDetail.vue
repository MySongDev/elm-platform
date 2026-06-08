<script setup>
import { computed, ref } from 'vue'
import SpecsSelector from '@/components/specs/SpecsSelector.vue'
import { CAKE_SPECS_CONFIG } from '@/config/specsConfig.js'

defineProps({
  productId: {
    type: [String, Number],
    required: true,
  },
  merchantType: {
    type: String,
    default: 'cake',
  },
})

// Refs
const specsSelectorRef = ref(null)

// 状态
const currentSpecsType = ref('6inch')
const currentSelections = ref({})
const currentPrice = ref(68)

/**
 * 是否显示规格切换标签
 */
const showSpecsTypeTabs = computed(() => {
  return Object.keys(CAKE_SPECS_CONFIG).length > 1
})

/**
 * 规格类型列表
 */
const specsTypeList = computed(() => {
  return Object.values(CAKE_SPECS_CONFIG).map(config => ({
    id: config.id,
    label: config.label,
  }))
})

/**
 * 切换规格类型
 */
function switchSpecsType(type) {
  currentSpecsType.value = type
  specsSelectorRef.value?.switchSpecsType(type)
}

/**
 * 规格变化回调
 */
function handleSpecsChange(data) {
  currentSelections.value = data.selections
  currentPrice.value = data.price
}

function syncSpecsState(data) {
  currentSelections.value = data?.selections ?? currentSelections.value
  currentPrice.value = data?.price ?? currentPrice.value
}

/**
 * 加入购物车
 */
function handleAddCart(data) {
  syncSpecsState(data)
}

/**
 * 立即购买
 */
function handleBuyNow(data) {
  syncSpecsState(data)
}
</script>

<template>
  <div class="product-detail">
    <!-- 商品主图 -->
    <div class="product-banner">
      <!-- <img src="/images/banner.jpg" alt="商品banner"> -->
    </div>

    <!-- 规格选择器 -->
    <SpecsSelector ref="specsSelectorRef" :product-id="productId" :merchant-type="merchantType"
      :initial-specs-type="currentSpecsType" @specs-change="handleSpecsChange" @add-cart="handleAddCart"
      @buy-now="handleBuyNow" />

    <!-- 规格切换标签（可选） -->
    <div v-if="showSpecsTypeTabs" class="specs-type-tabs">
      <div v-for="type in specsTypeList" :key="type.id" class="tab-item"
        :class="{ active: type.id === currentSpecsType }" @click="switchSpecsType(type.id)">
        {{ type.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-detail {
  min-height: 100vh;
  background: #F7F8FA;
}

.product-banner img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.specs-type-tabs {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
}

.tab-item {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  background: #F7F8FA;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.tab-item.active {
  color: #fff;
  background: #FF6B6B;
}
</style>
