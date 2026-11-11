<script setup>
/**
 * 点菜区只管连续商品流、分类联动和可视区加载触发。
 * 分页会话仍由页面提供；组件不请求店铺详情，也不直接修改全局购物车。
 */
import { computed, getCurrentInstance, nextTick, onMounted, onScopeDispose, ref, toRef, watch } from 'vue'

import CategoryMenu from './CategoryMenu.vue'
import FoodItem from './FoodItem.vue'

const props = defineProps({
  shopId: {
    type: String,
    required: true,
  },
  foodMenuData: {
    type: Array,
    default: () => [],
  },
  activeCategoryId: {
    type: [Number, String],
    default: null,
  },
  cartMap: {
    type: Map,
    default: () => new Map(),
  },
  active: {
    type: Boolean,
    default: true,
  },
  // 分类点击要等第一页完成再定位；普通 emit 不能取得父层加载任务的 Promise。
  loadCategoryFoods: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:activeCategoryId', 'add', 'decrease'])
const foodMenuData = toRef(props, 'foodMenuData')
const activeCategoryId = computed({
  get: () => props.activeCategoryId,
  set: id => emit('update:activeCategoryId', id),
})

// 重复点击同一分类时，先清空目标、下一拍再赋值，保留原页面的两拍定位。
const menuScrollViewId = ref('')
let scrollTimer = null

// 这些位置只供滚动事件读取，不绑定模板；只有跨分类时才更新高亮。
let anchorTops = []
let loaderBounds = []
let menuScrollTop = 0
let menuViewportHeight = 0
// 点击远分类时锁住反向高亮和预取，避免途中分类抢高亮、上方占位块增高挤走目标。
let isProgramScrolling = false
let programScrollTimer = null
// 节点查询和分类加载都可能晚到；换店或销毁后，旧回调不能再覆盖新状态。
let anchorQueryRevision = 0
let categorySelection = 0
let disposed = false

// 查询限定在拥有商品节点的组件内；继续用页面实例会跨过新增的组件边界。
const instance = getCurrentInstance()

onScopeDispose(() => {
  disposed = true
  anchorQueryRevision += 1
  categorySelection += 1
  clearTimeout(scrollTimer)
  clearTimeout(programScrollTimer)
})

watch(() => props.shopId, () => {
  categorySelection += 1
  anchorQueryRevision += 1
  anchorTops = []
  loaderBounds = []
  menuScrollTop = 0
  menuScrollViewId.value = ''
  isProgramScrolling = false
  clearTimeout(scrollTimer)
  clearTimeout(programScrollTimer)
})

/** 分页追加会改变后续分类的位置；每次渲染后批量重测，滚动时复用缓存。 */
function refreshAnchors() {
  if (disposed || !props.active) {
    return
  }
  const revision = ++anchorQueryRevision
  const query = uni.createSelectorQuery().in(instance?.proxy)
  query.select('.menu-area__list').boundingClientRect()
  query.select('.menu-area__list').scrollOffset()
  query.selectAll('.food-category').boundingClientRect()
  query.selectAll('.category-loader').boundingClientRect()
  query.exec((result) => {
    if (disposed || revision !== anchorQueryRevision) {
      return
    }
    const [listRect, offset, catRects, footerRects] = result || []
    if (!listRect || !Array.isArray(catRects) || !Array.isArray(footerRects)) {
      return
    }
    menuScrollTop = offset?.scrollTop || 0
    menuViewportHeight = listRect.height
    anchorTops = catRects.map(rect => rect.top - listRect.top + menuScrollTop)
    loaderBounds = footerRects.map(rect => ({
      top: rect.top - listRect.top + menuScrollTop,
      bottom: rect.bottom - listRect.top + menuScrollTop,
    }))
    loadVisibleCategoryFoods()
  })
}

function loadVisibleCategoryFoods(activeIndex = foodMenuData.value.findIndex(category => String(category.id) === String(activeCategoryId.value))) {
  if (isProgramScrolling || !props.active) {
    return
  }
  loaderBounds.forEach((bounds, index) => {
    // 不补载跳转目标上方的占位分类；向上滚、当前索引回退时再解锁。
    if (index >= activeIndex && bounds.bottom >= menuScrollTop && bounds.top <= menuScrollTop + menuViewportHeight + 160) {
      const category = foodMenuData.value[index]
      if (category && !category.loading) {
        props.loadCategoryFoods(category.id)
      }
    }
  })
}

// 组件挂载时首批菜单已经加载完，不能只等菜单 watch，否则首屏没有锚点和补页检查。
onMounted(() => {
  nextTick(refreshAnchors)
})

// 切评价先使旧查询失效，切回点菜再测；隐藏区的尺寸不能替换可见区缓存。
watch([foodMenuData, () => props.active], () => {
  loaderBounds = []
  anchorQueryRevision += 1
  nextTick(refreshAnchors)
})

/** 分类位置按商品流顺序递增，找顶边不高于当前滚动位置的最后一个分类。 */
function findActiveIndex(scrollTop) {
  let low = 0
  let high = anchorTops.length - 1
  let result = 0

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (anchorTops[mid] <= scrollTop) {
      result = mid
      low = mid + 1
    }
    else {
      high = mid - 1
    }
  }
  return result
}

function onMenuScroll(event) {
  menuScrollTop = event.detail?.scrollTop || 0
  if (isProgramScrolling) {
    return
  }
  if (anchorTops.length === 0) {
    refreshAnchors()
    return
  }

  // 分类顶边恰好贴住容器时，留 1px 容差，避免浮点误差把高亮留在上一类。
  const index = findActiveIndex(menuScrollTop + 1)
  const id = foodMenuData.value[index]?.id
  if (id != null && String(id) !== String(activeCategoryId.value)) {
    activeCategoryId.value = id
  }
  // emit 后父层 prop 尚未回传，本次预取直接用新索引，避免向上滚时仍按旧分类限制加载。
  loadVisibleCategoryFoods(index)
}

/** 最后分类可能太短、顶边到不了容器顶部；触底时直接高亮最后分类并续页。 */
function onMenuScrollToLower() {
  if (isProgramScrolling) {
    return
  }
  const last = foodMenuData.value.at(-1)
  if (last) {
    activeCategoryId.value = last.id
    props.loadCategoryFoods(last.id)
  }
}

async function onCategorySelect(id) {
  const selection = ++categorySelection
  const restaurantId = props.shopId
  const category = foodMenuData.value.find(item => String(item.id) === String(id))
  if (!category) {
    return
  }
  activeCategoryId.value = id

  // 请求完成前就锁住旧滚动位置，不能等菜品返回后才阻止反向高亮。
  isProgramScrolling = true
  clearTimeout(programScrollTimer)
  clearTimeout(scrollTimer)
  if (!category.loaded) {
    await props.loadCategoryFoods(id)
  }
  if (disposed || selection !== categorySelection || restaurantId !== props.shopId) {
    return
  }
  activeCategoryId.value = id
  await nextTick()
  if (disposed || selection !== categorySelection || restaurantId !== props.shopId) {
    return
  }

  // 等目标菜品渲染后再定位；不要把清空和赋值合并，否则连点同一分类可能不滚。
  menuScrollViewId.value = ''
  scrollTimer = setTimeout(() => {
    menuScrollViewId.value = `food-cat-${id}`
    scrollTimer = null
  }, 0)
  programScrollTimer = setTimeout(() => {
    isProgramScrolling = false
    programScrollTimer = null
    refreshAnchors()
  }, 500)
}
</script>

<template>
  <view class="menu-area">
    <CategoryMenu
      class="menu-area__side"
      :categories="foodMenuData"
      :active-id="activeCategoryId"
      @select="onCategorySelect"
    />

    <scroll-view
      class="menu-area__list"
      scroll-y
      :scroll-into-view="menuScrollViewId"
      :scroll-with-animation="true"
      :lower-threshold="40"
      @scroll="onMenuScroll"
      @scrolltolower="onMenuScrollToLower"
    >
      <text class="menu-area__tip">
        温馨提示：请适量点餐
      </text>

      <text v-if="!foodMenuData.length" class="menu-area__tip">
        本店暂无菜品
      </text>
      <view
        v-for="cat in foodMenuData"
        :id="`food-cat-${cat.id}`"
        :key="cat.id"
        class="food-category"
      >
        <view class="food-category__head">
          <text class="food-category__name">
            {{ cat.name }}
          </text>
          <text v-if="cat.description" class="food-category__desc">
            {{ cat.description }}
          </text>
        </view>

        <FoodItem
          v-for="food in cat.foods || []"
          :key="food._id || food.item_id"
          :food="food"
          :cart-map="cartMap"
          @add="emit('add', $event)"
          @decrease="emit('decrease', $event)"
        />
        <view class="category-loader" :class="{ 'is-placeholder': !cat.loaded }">
          <text v-if="cat.loading">
            菜品加载中…
          </text>
          <text
            v-else-if="cat.loadError" class="category-loader__action"
            @click="loadCategoryFoods(cat.id, { retry: true })"
          >
            加载失败，点击重试
          </text>
          <text
            v-else-if="!cat.loaded || cat.hasMore" class="category-loader__action"
            @click="loadCategoryFoods(cat.id)"
          >
            {{ cat.loaded ? '加载更多菜品' : '加载本分类菜品' }}
          </text>
          <text v-else>
            {{ cat.foods.length ? '本分类已全部加载' : '本分类暂无菜品' }}
          </text>
        </view>
      </view>

      <view class="menu-area__spacer" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.menu-area {
  display: flex;
  height: 100%;
}

.menu-area__side {
  flex-shrink: 0;
  width: 176rpx;
  height: 100%;
}

.menu-area__list {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding-inline: 20rpx;
  background: #fff;
}

.menu-area__tip {
  display: block;
  padding: 16rpx 0;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

.food-category {
  margin-bottom: 24rpx;
}

.food-category__head {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 16rpx 0 8rpx;
}

.food-category__name {
  font-size: 30rpx;
  font-weight: 800;
  color: #222;
}

.food-category__desc {
  font-size: 22rpx;
  color: #999;
}

.category-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96rpx;
  font-size: 24rpx;
  color: #888;

  &.is-placeholder {
    min-height: 280rpx;
  }
}

.category-loader__action {
  padding: 20rpx 24rpx;
  color: #666;
  background: #f7f7f7;
  border-radius: 16rpx;
}

/* 保留末分类的撑高空间，否则较短的末分类无法滚到视口顶端。 */
.menu-area__spacer {
  height: 500rpx;
}
</style>
