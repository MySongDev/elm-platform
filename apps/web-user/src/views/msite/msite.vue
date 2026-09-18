<script setup>
import { Pagination } from 'swiper/modules'

import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import BackTop from '@/components/common/BackTop/BackTop.vue'
import ShopList from '@/components/common/ShopList/ShopList.vue'

import { useAuthRedirect, useLoadMore } from '@/composables/app'
import { useScrollPosition } from '@/composables/ui'
import { getFoodCategoryList, getShopList } from '@/services/api/api-miste'
import { useLocationStore } from '@/stores/modules/store-locations'
import 'swiper/css'
import 'swiper/css/pagination'

defineOptions({ name: 'Msite' })
const router = useRouter()
const LocationStore = useLocationStore()
const { isAuthenticated, redirectToLogin } = useAuthRedirect()

const FoodCategoryList = ref([])
const foodCategoryLoading = ref(true)

getFoodCategoryList()
  .then(res => FoodCategoryList.value = res)
  .finally(() => foodCategoryLoading.value = false)

const imgBaseUrl = 'https://fuss10.elemecdn.com'

// ========== 数据 ==========
const {
  list: shopList,
  loading,
  finished,
  loadMore,
  refresh,
} = useLoadMore(
  ({ page, pageSize }) => {
    const offset = (page - 1) * pageSize
    return getShopList(LocationStore.latitude, LocationStore.longitude, offset, pageSize)
  },
  { pageSize: 20 },
)

// ========== Refs ==========
const msiteRef = useTemplateRef('msiteRef')
const headerRef = useTemplateRef('headerRef')

// 记录页面滚动位置（使用 msiteRef 作为滚动容器）
useScrollPosition(msiteRef)

// ========== 滚动控制 ==========
const isSticky = ref(false)

// 计算吸顶临界点
let stickyThreshold = 0
function updateThreshold() {
  if (headerRef.value) {
    stickyThreshold = headerRef.value.offsetHeight
  }
}

// const { elRef: headerRef, height: stickyThreshold } = useElementSize()
// 当列表滚回顶部，恢复页面整体滚动
function handleWindowScroll() {
  const scrollY = window.scrollY || msiteRef.value?.scrollTop || 0
  isSticky.value = scrollY >= stickyThreshold // 自动适配最新高度
}

let isScrollListenerBound = false

function bindScrollListener() {
  if (!msiteRef.value || isScrollListenerBound)
    return

  msiteRef.value.addEventListener('scroll', handleWindowScroll, { passive: true })
  isScrollListenerBound = true
}

function unbindScrollListener() {
  if (!msiteRef.value || !isScrollListenerBound)
    return

  msiteRef.value.removeEventListener('scroll', handleWindowScroll)
  isScrollListenerBound = false
}

function toShop(item) {
  if (!isAuthenticated.value) {
    redirectToLogin()
    return
  }

  router.push({
    path: '/shop',
    query: { shopid: item.id },
  })
}

// ========== 加载更多 ==========
function handleLoadMore() {
  if (!isAuthenticated.value) {
    redirectToLogin()
    return
  }
  loadMore()
}

// // ========== 轮播图分页 ==========
const PAGE_SIZE = 8

const paginatedFoodList = computed(() => {
  const list = FoodCategoryList.value || []
  return Array.from(
    { length: Math.ceil(list.length / PAGE_SIZE) },
    (_, i) => list.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE),
  )
})
// ========== 工具函数 ==========
function extractIdFromUrl(url) {
  try {
    const urlObj = new URL(url)
    const filterKeyEncoded = urlObj.searchParams.get('filter_key')
    if (!filterKeyEncoded)
      return null

    const filterKeyDecoded = decodeURIComponent(filterKeyEncoded)
    const filterObj = JSON.parse(filterKeyDecoded)
    return filterObj?.restaurant_category_id?.id
  }
  catch (error) {
    console.error('解析失败:', error.message)
    return null
  }
}

// 坐标偏移阈值（约 0.01°≈1km）：小于此值视作 GPS 抖动，不重拉商家；
// 超过则认为换了位置（如跨城），需要用新坐标刷新列表。
const LOCATION_DRIFT_THRESHOLD = 0.01

function refreshShopsIfLocationChanged() {
  // mount 时 useLoadMore 已用缓存坐标（或空坐标）拉过一次，
  // 这里在后台拿到真实坐标后按需重拉：首次无缓存 → 必刷；跨城偏移 → 重刷。
  const prevLat = LocationStore.latitude
  const prevLng = LocationStore.longitude
  const hadCoords = Boolean(prevLat && prevLng)

  return LocationStore
    .loadCurrentLocation({ silent: hadCoords })
    .then((located) => {
      if (!located)
        return

      const latDrift = Math.abs(located.latitude - prevLat)
      const lngDrift = Math.abs(located.longitude - prevLng)
      const drifted = latDrift > LOCATION_DRIFT_THRESHOLD || lngDrift > LOCATION_DRIFT_THRESHOLD

      if (!hadCoords || drifted)
        refresh()
    })
}

onMounted(() => {
  updateThreshold()
  bindScrollListener()
  handleWindowScroll()
  refreshShopsIfLocationChanged()
})

onBeforeUnmount(() => {
  unbindScrollListener()
})

onActivated(() => {
  updateThreshold()
  bindScrollListener()
  handleWindowScroll()
})

onDeactivated(() => {
  unbindScrollListener()
})
</script>

<template>
  <div ref="msiteRef" class="msite">
    <!-- 轮播图 -->
    <div ref="headerRef" class="header-content">
      <div class="swiper">
        <img v-if="foodCategoryLoading" src="./images/fl.svg" alt="轮播图加载中" class="swiper-placeholder">
        <Swiper v-else-if="paginatedFoodList.length > 0" :modules="[Pagination]" :loop="paginatedFoodList.length >= 2" :pagination="{ clickable: true }">
          <SwiperSlide v-for="(page, index) in paginatedFoodList" :key="index" class="slide-style">
            <figure v-for="(item, itemIndex) in page" :key="itemIndex" class="slide-item">
              <router-link v-slot="{ navigate }"
                :to="{ path: '/food', query: { foodtitle: item.title, restaurant_category_id: extractIdFromUrl(item.link) } }"
                custom>
                <img :src="imgBaseUrl + item.image_url" :alt="item.title" class="slide-img" @click="navigate">
                <figcaption class="slide-title">
                  {{ item.title }}
                </figcaption>
              </router-link>
            </figure>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
    <!-- 商家 -->
    <div class="shopping-contnet">
      <h2 class="contnet-title" :class="{ 'is-sticky': isSticky }">
        <SvgIcon icon-class="contnet-title_svg" icon-name="shop" />
        附近商家
      </h2>

      <ShopList :list="shopList" :loading="loading" :finished="finished" :page-ref="msiteRef"
        :enable-back-top="false" @reach-bottom="handleLoadMore" @item-click="toShop" />
    </div>

    <BackTop :target="msiteRef" :show-after="headerRef" />
  </div>
</template>

<style lang="scss" scoped>
.msite {
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.header-content {
  margin-bottom: 15px;
}

.swiper {
  width: 100%;
  height: 48vw;
  border-bottom: 0.6px solid #e4e4e4;
}

.swiper-placeholder {
  display: block;
  width: 100%;
  height: 100%;
}

.slide-style {
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(4, 1fr);
  background: #fff;

  .slide-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .slide-img {
    width: 45%;
    margin-bottom: 7px;
  }

  .slide-title {
    font-size: 13px;
    color: #666;
    text-align: center;
  }
}

.shopping-contnet {
  background: #fff;

  .contnet-title {
    padding: 10px 0 10px 10px;
    font-size: 14px;
    color: #999;
    background: #fff;
    border-bottom: 1px solid #eee;

    &.is-sticky {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
    }

    &_svg {
      width: 20px;
      height: 20px;
      margin-right: 5px;
      margin-bottom: 6px;
      vertical-align: middle;
      fill: #999;
    }
  }
}
</style>
