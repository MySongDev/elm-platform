<script setup>
import { computed, onActivated, onDeactivated, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ShopList from '@/components/common/ShopList/ShopList.vue'
import { useLoadMore } from '@/composables/app'
import { getFoodActivity, getFoodCategory, getFoodDelivery } from '@/services/api/api-food.js'

import { getShopList } from '@/services/api/api-miste.js'
import CategoryPanel from './components/CategoryPanel.vue'
import FilterHeader from './components/FilterHeader.vue'
import FilterPanel from './components/FilterPanel.vue'
import SortPanel from './components/SortPanel.vue'
import { useDropdown } from './composables/useDropdown.js'
import { useFilter } from './composables/useFilter.js'

const route = useRoute()
const router = useRouter()
const { activeTab, showDropdown, toggleDropdown, closeDropdown } = useDropdown()

const PAGE_SIZE = 20
const DEFAULT_LOCATION = {
  latitude: 31.22299,
  longitude: 121.36025,
}
const CATEGORY_LOCATION = {
  latitude: 33.33,
  longitude: 22.44,
}
const SCROLL_STORAGE_KEY = 'scroll:/food'

const categories = shallowRef([])
const selectedCategoryName = shallowRef(route.query.FoodTitle || '分类')
const restaurantCategoryId = shallowRef(Number(route.query.restaurant_category_id) || null)
const {
  list: shopList,
  loading,
  finished,
  loadMore,
} = useLoadMore(
  ({ page, pageSize }) => getShopList(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, (page - 1) * pageSize, pageSize),
  { pageSize: PAGE_SIZE },
)
const deliveryTags = shallowRef([])
const filterAttributes = shallowRef([])
const deliveryValues = ref([])
const sortValue = shallowRef(0)
const switchTrigger = shallowRef(0)
const { filterValues, clearFilter } = useFilter()

const foodPageRef = useTemplateRef('foodPageRef')

function saveScrollPosition() {
  if (!foodPageRef.value)
    return

  sessionStorage.setItem(SCROLL_STORAGE_KEY, String(foodPageRef.value.scrollTop))
}

function restoreScrollPosition() {
  const savedPosition = Number(sessionStorage.getItem(SCROLL_STORAGE_KEY))
  if (!Number.isFinite(savedPosition) || !foodPageRef.value)
    return

  requestAnimationFrame(() => {
    if (foodPageRef.value)
      foodPageRef.value.scrollTop = savedPosition
  })
}

const categoryTitle = computed(() => {
  if (!restaurantCategoryId.value)
    return '分类'
  return selectedCategoryName.value
})

function handleCategorySelect(category) {
  restaurantCategoryId.value = category.id
  selectedCategoryName.value = category.name
}

function handleSubSelect({ parent, sub }) {
  restaurantCategoryId.value = parent.id
  selectedCategoryName.value = sub.name
  closeDropdown()
}

const activeCategoryIndex = computed(() => {
  if (!restaurantCategoryId.value || !categories.value.length)
    return 0
  const index = categories.value.findIndex(cat => cat.id === restaurantCategoryId.value)
  return index >= 0 ? index : 0
})

async function fetchFoodCategory() {
  const res = await getFoodCategory(CATEGORY_LOCATION.latitude, CATEGORY_LOCATION.longitude)
  categories.value = Array.isArray(res) ? res : []
}

const sortOptions = [
  { text: '智能排序', value: 4, iconColor: '#409EFF' },
  { text: '距离最近', value: 5, iconColor: '#67C23A' },
  { text: '销量最高', value: 6, iconColor: '#FF6B6B' },
  { text: '起送价最低', value: 1, iconColor: '#E6A23C' },
  { text: '配送速度最快', value: 2, iconColor: '#67C23A' },
  { text: '评分最高', value: 3, iconColor: '#FFD700' },
]

async function fetchDelivery() {
  const res = await getFoodDelivery()
  deliveryTags.value = Array.isArray(res) ? res : []
}

async function fetchFilterAttributes() {
  const res = await getFoodActivity()
  filterAttributes.value = Array.isArray(res) ? res : []
}

function toShop(item) {
  router.push({
    path: '/shop',
    query: { shopid: item.id },
  })
}

function handleSortSelect(val) {
  sortValue.value = val
  closeDropdown()
}

function handleClear() {
  deliveryValues.value = []
  clearFilter()
}

function handleFilterConfirm() {
  closeDropdown()
}

watch(activeTab, () => {
  if (showDropdown.value)
    switchTrigger.value++
})

onMounted(() => {
  fetchFoodCategory()
  fetchDelivery()
  fetchFilterAttributes()
})

onActivated(() => {
  restoreScrollPosition()
})

onDeactivated(() => {
  saveScrollPosition()
})
</script>

<template>
  <div ref="foodPageRef" class="food-page">
    <div class="food-filter">
      <head-top :head-title="selectedCategoryName" />
      <FilterHeader
        :active-tab="activeTab"
        :show-dropdown="showDropdown"
        :category-name="categoryTitle"
        @toggle="toggleDropdown"
      />

      <Transition name="container">
        <div v-if="showDropdown" class="dropdown-wrapper">
          <Transition name="content" mode="out-in">
            <div :key="activeTab + switchTrigger" class="dropdown-content">
              <CategoryPanel
                v-if="activeTab === 'category'"
                :categories="categories"
                :active-index="activeCategoryIndex"
                @select-category="handleCategorySelect"
                @select-sub="handleSubSelect"
              />

              <SortPanel
                v-else-if="activeTab === 'sort'"
                v-model="sortValue"
                :options="sortOptions"
                @select="handleSortSelect"
                @click.stop
              />

              <FilterPanel
                v-else-if="activeTab === 'filter'"
                v-model="filterValues"
                v-model:delivery-value="deliveryValues"
                :attributes="filterAttributes"
                :delivery-tags="deliveryTags"
                @clear="handleClear"
                @confirm="handleFilterConfirm"
              />
            </div>
          </Transition>
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="showDropdown" class="overlay" @click="closeDropdown" />
      </Transition>
    </div>

    <ShopList
      :list="shopList"
      :loading="loading"
      :finished="finished"
      @reach-bottom="loadMore"
      @item-click="toShop"
    />
  </div>
</template>

<style scoped>
.food-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.food-filter {
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 10;
}

/* ========== 容器动画：首次展开 ========== */
.container-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top;
}

.container-leave-active {
  transition: all 0.25s ease-in;
  transform-origin: top;
}

.container-enter-from {
  opacity: 0;
  transform: perspective(1000px) rotateX(-15deg) translateY(-20px);
  max-height: 0;
}

.container-enter-to {
  opacity: 1;
  transform: perspective(1000px) rotateX(0) translateY(0);
  max-height: 70vh;
}

.container-leave-from {
  opacity: 1;
  transform: perspective(1000px) rotateX(0) translateY(0);
  max-height: 70vh;
}

.container-leave-to {
  opacity: 0;
  transform: perspective(1000px) rotateX(-10deg) translateY(-10px);
  max-height: 0;
}

/* ========== 内容动画：选项卡切换 ========== */
.content-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.content-leave-active {
  transition: all 0.2s ease;
}

.content-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
  filter: blur(4px);
}

.content-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.content-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
  filter: blur(0);
}

.content-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
  filter: blur(4px);
}

/* ========== 遮罩层动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 容器样式 ========== */
.dropdown-wrapper {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border-radius: 0 0 12px 12px;
  will-change: transform, opacity, max-height;
}

.dropdown-content {
  max-height: 70vh;
  overflow-y: auto;
  will-change: transform, opacity, filter;
}

/* 滚动条美化 */
.dropdown-content::-webkit-scrollbar {
  width: 4px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 99;
}
</style>
