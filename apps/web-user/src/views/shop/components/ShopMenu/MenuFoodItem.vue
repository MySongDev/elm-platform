<!-- components/ShopMenu/MenuFoodItem.vue -->
<!--
  菜品列表项
  - 无规格商品：直接 +/- 操作购物车
  - 有规格商品：点击"选规格"按钮 → 打开 FoodSpecPanel → 确认后加车
-->
<script setup>
import { computed, ref } from 'vue'
import { getImageUrl } from '@/config'
import FoodSpecPanel from './FoodSpecPanel.vue'
import {
  getCartQty,
  getFoodActivityBoxStyle,
  getFoodActivityTextStyle,
  getFoodOriginalPrice,
  getFoodPrice,
  getFoodTipsLine,
  hasFoodSpecs,
} from './shopFoodUtils.js'

const props = defineProps({
  food: { type: Object, required: true },
  cartMap: { type: Map, default: () => new Map() },
})
const emit = defineEmits(['add', 'decrease'])

// 当前菜品在购物车中的数量
const cartQty = computed(() => getCartQty(props.cartMap, props.food))

// ==================== 规格弹窗 ====================

// 当前打开规格弹窗的菜品；null 表示弹窗关闭
const specFood = ref(null)

// 点击"选规格"按钮：将当前菜品传入弹窗
function openSpecPanel() {
  specFood.value = props.food
}

// 弹窗关闭
function closeSpecPanel() {
  specFood.value = null
}

// 用户在弹窗内确认规格并加购
// FoodSpecPanel emit: { food, selectedSpecs }
function onSpecConfirm({ food, specIndex, rect }) {
  emit('add', food, specIndex, rect)
}

// 无规格商品点击"+"按钮
function onAddClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  emit('add', props.food, undefined, rect)
}
</script>

<template>
  <div class="food-item">
    <img v-lazy="getImageUrl(food.image_path)" loading="lazy" class="food-img">

    <div class="food-detail">
      <!-- 标题 + 标签 -->
      <div class="title-row">
        <span class="title-text">{{ food.name }}</span>
        <span v-if="food.attributes?.length" class="labels">
          <span v-for="attr in food.attributes" :key="`${food._id}-${attr?.icon_name}`" class="label"
            :style="{ color: `#${attr?.icon_color}`, borderColor: `#${attr?.icon_color}` }">
            {{ attr?.icon_name }}
          </span>
        </span>
      </div>

      <!-- 活动标签 -->
      <div v-if="food.activity?.image_text" class="activity-tag" :style="getFoodActivityBoxStyle(food)">
        <span :style="getFoodActivityTextStyle(food)">{{ food.activity.image_text }}</span>
      </div>

      <!-- 月售 / 好评率 -->
      <p class="tips-line">
        {{ getFoodTipsLine(food) }}
      </p>

      <!-- 价格 + 操作区 -->
      <div class="bottom">
        <div class="price-block">
          <span class="price"><i>¥</i>{{ getFoodPrice(food) }}</span>
          <span v-if="getFoodOriginalPrice(food) > 0" class="old">¥{{ getFoodOriginalPrice(food) }}</span>
        </div>

        <div class="actions">
          <!-- 有规格：弹出规格选择面板 -->
          <template v-if="hasFoodSpecs(food)">
            <button type="button" class="spec-btn" @click.stop="openSpecPanel">
              选规格
            </button>
          </template>

          <!-- 无规格：直接加减购物车 -->
          <template v-else>
            <div class="cart-btns">
              <template v-if="cartQty > 0">
                <button type="button" class="decrease-btn" @click.stop="emit('decrease', food)">
                  −
                </button>
                <span class="qty">{{ cartQty }}</span>
              </template>
              <button type="button" class="add-btn" @click.stop="onAddClick">
                +
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!--
    规格选择弹窗
    Teleport 到 body，避免被父级 overflow:hidden 裁剪
    specFood 为 null 时组件不渲染（v-if 而非 v-show，避免 watch 无意义触发）
  -->
  <FoodSpecPanel v-if="specFood" :food="specFood" @confirm="onSpecConfirm" @close="closeSpecPanel" />
</template>

<style lang="scss" scoped>
.food-item {
  display: flex;
  gap: 10px;
  padding: 10px 7px 10px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.food-img {
  width: 78px;
  height: 78px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.food-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.title-row {
  font-size: 15px;
  font-weight: 700;
  color: #222;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.title-text {
  flex: 1;
  min-width: 0;
  @include text-ellipsis();
}

.labels {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.label {
  border: 1px solid currentColor;
  border-radius: 2px;
  font-size: 10px;
  padding: 1px 4px;
  font-weight: 600;
}

.activity-tag {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 600;
}

.tips-line {
  margin: 6px 0 0;
  font-size: 11px;
  color: #999;
}

.bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 10px;
}

.price-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price {
  color: #fb4e44;
  font-size: 18px;
  font-weight: 800;

  i {
    font-size: 12px;
    margin-right: 1px;
    font-style: normal;
  }
}

.old {
  font-size: 12px;
  color: #bbb;
  text-decoration: line-through;
}

.actions {
  flex-shrink: 0;
}

.spec-btn {
  border: none;
  border-radius: 14px;
  padding: 6px 14px;
  font-size: 13px;
  color: #333;
  background: #ffd45e;
  font-weight: 600;
  cursor: pointer;
}

.cart-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.decrease-btn,
.add-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.decrease-btn {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
}

.add-btn {
  background: #ffd600;
  color: #333;
}

.qty {
  font-size: 14px;
  color: #333;
  min-width: 20px;
  text-align: center;
  font-weight: 600;
}
</style>
