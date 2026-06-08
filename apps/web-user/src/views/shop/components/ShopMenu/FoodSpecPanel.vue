<!-- components/ShopMenu/FoodSpecPanel.vue -->
<!--
  规格选择弹窗（居中模态框）

  数据结构说明（来自真实接口）：
  - food.specifications: Array<{ name: string, values: string[] }>
      规格组定义，values 是纯字符串数组（如 ["默认", "大份", ""]）
      空字符串表示无效选项，渲染时过滤掉

  - food.specfoods: Array<{ price, specs: Array<{ name, value }>, specs_name, sold_out, ... }>
      每个 specfood 是一个具体 SKU，specs[].value 对应 specifications[].values[] 中的字符串
      通过「所有规格组的选中值」与 specfood.specs 全量匹配，找到当前 SKU 及其价格

  用法：<FoodSpecPanel v-if="specFood" :food="specFood" @confirm="onConfirm" @close="closePanel" />
  emit confirm payload: { food, selectedSpecs: { [specName]: value }, specfood }
-->
<script setup>
import { computed, reactive, watch } from 'vue'
import { getFoodPrice } from './shopFoodUtils.js'

const props = defineProps({
  food: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'confirm', // payload: { food, selectedSpecs, specfood }
  'close',
])

// ==================== 规格选项预处理 ====================

/**
 * 过滤掉空字符串 value，避免渲染空按钮
 * 返回 Array<{ name: string, values: string[] }>
 */
const cleanedSpecs = computed(() => {
  return (props.food.specifications ?? [])
    .map(spec => ({
      ...spec,
      values: (spec.values ?? []).filter(v => v !== '' && v != null),
    }))
    .filter(spec => spec.values.length > 0)
})

// ==================== 选中状态 ====================
// 结构：{ [specName]: value }  例如 { "规格": "默认" }
const selectedSpecs = reactive({})

// food 变化时重置，并默认选中每组第一个有效选项
watch(
  () => props.food,
  () => {
    Object.keys(selectedSpecs).forEach(k => delete selectedSpecs[k])
    cleanedSpecs.value.forEach((spec) => {
      selectedSpecs[spec.name] = spec.values[0]
    })
  },
  { immediate: true },
)

function selectSpec(specName, value) {
  selectedSpecs[specName] = value
}

// ==================== 匹配当前 SKU ====================

/**
 * 根据所有规格组的选中值，从 specfoods 里找到对应的 SKU
 * 匹配规则：specfood.specs 里每一个 {name, value} 都在 selectedSpecs 中存在且一致
 */
const currentSpecfood = computed(() => {
  const entries = Object.entries(selectedSpecs)
  if (!entries.length)
    return props.food.specfoods?.[0] ?? null

  return props.food.specfoods?.find(sf =>
    entries.every(([name, value]) =>
      sf.specs?.some(s => s.name === name && s.value === value),
    ),
  ) ?? null
})

// 当前 SKU 价格，找不到匹配 SKU 时降级用菜品默认价
const currentPrice = computed(() =>
  currentSpecfood.value?.price ?? getFoodPrice(props.food),
)

// 是否售罄
const isSoldOut = computed(() => currentSpecfood.value?.sold_out === true)

// 已选规格的展示文本，如"规格：默认"
const selectedLabel = computed(() => {
  return cleanedSpecs.value
    .map(spec => `${spec.name}：${selectedSpecs[spec.name] ?? ''}`)
    .join(' / ')
})

// ==================== 规格价格映射（性能优化） ====================

/**
 * 构建规格 → 价格的快速查找映射
 * 结构：Map<specName, Map<value, price>>
 * 避免在模板中每次渲染都进行 O(n) 的 find 查找
 */
const specPriceMap = computed(() => {
  const map = new Map()
  const specfoods = props.food.specfoods ?? []

  for (const spec of cleanedSpecs.value) {
    const valuePriceMap = new Map()
    for (const value of spec.values) {
      // 找到包含该规格值的具体 SKU，取价格
      const matched = specfoods.find(sf =>
        sf.specs?.some(s => s.name === spec.name && s.value === value),
      )
      valuePriceMap.set(value, matched?.price ?? getFoodPrice(props.food))
    }
    map.set(spec.name, valuePriceMap)
  }

  return map
})

/**
 * 获取单个规格选项的价格
 * @param {string} specName - 规格组名称
 * @param {string} value - 规格值
 * @returns {number} 价格
 */
function getSpecValuePrice(specName, value) {
  return specPriceMap.value.get(specName)?.get(value) ?? getFoodPrice(props.food)
}

// ==================== 事件处理 ====================

function handleConfirm(event) {
  if (isSoldOut.value)
    return

  const rect = event?.currentTarget?.getBoundingClientRect?.()
  const specIndex = props.food.specfoods?.findIndex(spec => spec === currentSpecfood.value)

  emit('confirm', {
    food: props.food,
    selectedSpecs: { ...selectedSpecs },
    specfood: currentSpecfood.value,
    specIndex: specIndex >= 0 ? specIndex : 0,
    rect,
  })
  emit('close')
}

function handleClose() {
  emit('close')
}

// ==================== 键盘支持 ====================

/**
 * 处理键盘事件，支持 ESC 关闭弹窗
 * @param {KeyboardEvent} e
 */
function handleKeydown(e) {
  if (e.key === 'Escape') {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="spec-panel">
      <div v-if="food" class="spec-overlay" role="dialog" aria-modal="true" aria-labelledby="food-title"
        @click.self="handleClose" @keydown="handleKeydown">
        <div class="spec-panel">
          <!-- 关闭按钮 -->
          <button class="close-btn" aria-label="关闭" type="button" @click="handleClose">
            ✕
          </button>

          <!-- 菜品标题 -->
          <h3 id="food-title" class="food-title">
            {{ food.name }}
          </h3>

          <!-- 规格组列表 -->
          <div class="spec-groups">
            <div v-for="spec in cleanedSpecs" :key="spec.name" class="spec-group" role="radiogroup"
              :aria-label="spec.name">
              <!-- 规格组名称，如"份量"、"规格" -->
              <p class="spec-group-name">
                {{ spec.name }}
              </p>

              <!-- 规格选项 -->
              <div class="spec-values">
                <button v-for="value in spec.values" :key="value" type="button" class="spec-value-btn" role="radio"
                  :aria-checked="selectedSpecs[spec.name] === value"
                  :class="{ active: selectedSpecs[spec.name] === value }" @click="selectSpec(spec.name, value)">
                  {{ value }}
                  <!-- 对应 SKU 的价格 -->
                  <span class="spec-value-price">
                    ¥ {{ getSpecValuePrice(spec.name, value) }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- 底部：已选信息 + 加购按钮 -->
          <div class="panel-footer">
            <p class="selected-label">
              已选规格：{{ selectedLabel }}
            </p>
            <div class="footer-action">
              <span class="current-price">
                <i>¥</i>{{ currentPrice }}
              </span>
              <button type="button" class="confirm-btn" :class="{ 'confirm-btn--disabled': isSoldOut }"
                :disabled="isSoldOut" @click="handleConfirm">
                {{ isSoldOut ? '已售罄' : '+ 加入购物车' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
// ===== 遮罩层 =====
.spec-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center; // 垂直居中
  justify-content: center; // 水平居中
  padding: 16px; // 小屏时留出边距
  background: rgb(0 0 0 / 45%);
}

// ===== 面板主体 =====
.spec-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px; // 限制最大宽度，避免大屏过宽
  max-height: min(80vh, 600px); // 限制最大高度
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 15%); // 增加层次感
}

// ===== 关闭按钮 =====
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  color: #888;
  cursor: pointer;
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  transition: background 0.15s;

  &:hover {
    background: #e0e0e0;
  }

  &:active {
    background: #d0d0d0;
  }
}

// ===== 菜品标题 =====
.food-title {
  padding-right: 36px; // 避免与关闭按钮重叠
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

// ===== 规格组 =====
.spec-groups {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain; // 防止滚动链传递

  &::-webkit-scrollbar {
    display: none;
  }
}

.spec-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.spec-group-name {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

// 规格选项按钮
.spec-value-btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;

  &:hover:not(.active) {
    border-color: #ccc;
  }

  // 选中态
  &.active {
    color: #f60;
    background: #fff8ee;
    border-color: #ff8c00;

    .spec-value-price {
      color: #f60;
    }
  }
}

.spec-value-price {
  font-size: 12px;
  font-weight: 700;
  color: #fb4e44;
}

// ===== 底部操作区 =====
.panel-footer {
  padding: 16px 0 0;
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.selected-label {
  margin: 0 0 12px;
  overflow: hidden;
  font-size: 12px;
  color: #999;
  text-overflow: ellipsis;

  // 最多一行，超长省略
  white-space: nowrap;
}

.footer-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.current-price {
  font-size: 28px;
  font-weight: 800;
  color: #fb4e44;

  i {
    margin-right: 1px;
    font-size: 14px;
    font-style: normal;
  }
}

.confirm-btn {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  color: #333;
  cursor: pointer;
  background: #ffd600;
  border: none;
  border-radius: 22px;
  transition: filter 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    filter: brightness(0.97);
  }

  &:active:not(:disabled) {
    filter: brightness(0.92);
  }

  // 售罄态
  &--disabled {
    color: #aaa;
    cursor: not-allowed;
    background: #e0e0e0;
  }
}

// ===== 入场 / 离场动画 =====
// 遮罩整体淡入，面板从中心缩放 + 淡入
.spec-panel-enter-active {
  transition: opacity 0.25s ease-out;

  .spec-panel {
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease-out;
  }
}

.spec-panel-leave-active {
  transition: opacity 0.2s ease-in;

  .spec-panel {
    transition: transform 0.2s ease-in, opacity 0.2s ease-in;
  }
}

.spec-panel-enter-from {
  opacity: 0;

  .spec-panel {
    opacity: 0;
    transform: scale(0.9);
  }
}

.spec-panel-leave-to {
  opacity: 0;

  .spec-panel {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
