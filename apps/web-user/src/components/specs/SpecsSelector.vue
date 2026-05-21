<script setup>
import { computed, ref, watch } from 'vue'
import { getSpecsConfig } from '@/config/specsConfig.js'
import SpecsFooter from './SpecsFooter.vue'
import SpecsGroup from './SpecsGroup.vue'
import SpecsHeader from './SpecsHeader.vue'

// Props
const props = defineProps({
  /** 商品ID */
  productId: {
    type: [String, Number],
    required: true,
  },
  /** 商家类型 */
  merchantType: {
    type: String,
    default: 'cake',
  },
  /** 初始规格类型 */
  initialSpecsType: {
    type: String,
    default: '6inch',
  },
})

// Emits
const emit = defineEmits(['add-cart', 'buy-now', 'specs-change'])

// 响应式状态
const specsType = ref(props.initialSpecsType)
const selectedSpecs = ref({})

/**
 * 当前规格配置
 */
const currentConfig = computed(() => {
  return getSpecsConfig(specsType.value, props.merchantType)
})

/**
 * 计算价格
 */
const calculatedPrice = computed(() => {
  if (!currentConfig.value)
    return 0

  let basePrice = currentConfig.value.price

  // 累加每个已选规格的价格
  Object.entries(selectedSpecs.value).forEach(([specId, optionId]) => {
    const specGroup = currentConfig.value.specs.find(s => s.id === specId)
    if (specGroup) {
      const option = specGroup.options.find(o => o.id === optionId)
      if (option) {
        basePrice += option.price
      }
    }
  })

  return basePrice
})

/**
 * 切换规格类型
 */
function switchSpecsType(newType) {
  specsType.value = newType
  // 切换规格时重置选择
  selectedSpecs.value = {}
}

/**
 * 处理规格选择
 */
function handleSpecSelect(specGroupId, optionId) {
  selectedSpecs.value = {
    ...selectedSpecs.value,
    [specGroupId]: optionId,
  }

  emit('specs-change', {
    specsType: specsType.value,
    selections: selectedSpecs.value,
    price: calculatedPrice.value,
  })
}

/**
 * 加入购物车
 */
function handleAddCart() {
  emit('add-cart', {
    productId: props.productId,
    specsType: specsType.value,
    selections: selectedSpecs.value,
    price: calculatedPrice.value,
  })
}

/**
 * 立即购买
 */
function handleBuyNow() {
  emit('buy-now', {
    productId: props.productId,
    specsType: specsType.value,
    selections: selectedSpecs.value,
    price: calculatedPrice.value,
  })
}

// 初始化默认选项
watch(currentConfig, (config) => {
  if (config?.specs) {
    const defaults = {}
    config.specs.forEach((spec) => {
      if (spec.required && spec.options?.length > 0) {
        defaults[spec.id] = spec.options[0].id
      }
    })
    selectedSpecs.value = defaults
  }
}, { immediate: true })

// 暴露方法供父组件调用
defineExpose({
  switchSpecsType,
  getSelectedSpecs: () => ({ ...selectedSpecs.value }),
  getTotalPrice: () => calculatedPrice.value,
})
</script>

<template>
  <div class="specs-selector">
    <!-- 规格头部信息 -->
    <SpecsHeader :config="currentConfig" :selected-specs="selectedSpecs" />

    <!-- 规格选项列表 -->
    <div class="specs-body">
      <SpecsGroup v-for="specGroup in currentConfig.specs" :key="specGroup.id" :spec-group="specGroup"
        :selected-value="selectedSpecs[specGroup.id]" :ui-config="currentConfig.ui" @select="handleSpecSelect" />
    </div>

    <!-- 底部价格和操作 -->
    <SpecsFooter :config="currentConfig" :selected-specs="selectedSpecs" :total-price="calculatedPrice"
      @add-cart="handleAddCart" @buy-now="handleBuyNow" />
  </div>
</template>

<style scoped>
.specs-selector {
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.specs-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 16px 16px;
}
</style>
