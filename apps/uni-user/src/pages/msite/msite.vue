<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/msite/msite.vue 同源改造（tabBar 首页）。
 *
 * 差异与修正（七处）：
 * 1. **swiper 库 → 原生 `<swiper>`**（方案 ⑦ 节）：web-user 用 swiper/vue + Pagination module
 *    + 两个 css import；小程序端用原生组件，分页点由 indicator-dots 承担。
 * 2. ★ **轮播图域名收口**：web-user `:29` 硬编码 `https://fuss10.elemecdn.com` ——
 *    这是**第二个第三方域名**（方案议题 2 只处理了 elm.cangdu.org，漏了它）。
 *    小程序白名单同样不放行 → 走后端代理的 **cdn 子路由**（getCarouselImageUrl）。
 *    ✅ **已实测**（2026-09-28）：`/2/35/xxx.jpeg` 在 fuss10 可达（200 image/jpeg），
 *    在 elm.cangdu.org/img 是 404 → 代理已加 `/api/img/cdn/*` → fuss10 的前缀路由。
 * 3. **`/food` 死链**（★ 修正方案 E 节的实测错误）：方案称「没有任何迁移页面跳转到
 *    /food」，但 web-user `:196` 的轮播项正是跳 `/food`（不迁移页）。
 *    处置：点击轮播项 → toast「敬请期待」（与 profileConfig 死链同策略），不跳转。
 * 4. `useScrollPosition`（sessionStorage 记忆滚动）**作废**：tabBar 页原生保留滚动位置
 *    （方案 D 节），小程序也无 sessionStorage。
 * 5. 滚动监听 `addEventListener('scroll')` → scroll-view 的 `@scroll`；
 *    吸顶阈值 `headerRef.offsetHeight` → createSelectorQuery（异步，onReady 查一次）。
 * 6. `onActivated/onDeactivated`（KeepAlive）→ tabBar 页不销毁，用 onShow/onHide。
 * 7. `extractIdFromUrl` 的 `new URL()` → **字符串解析**：Batch 0 第 10 项
 *    （new URL 小程序可用性）尚未人工验证，与 platform/image.ts 同防御理由。
 *    ⚠️ 该函数解析的是 `eleme://` scheme 的 link（实测），new URL 对它本就勉强。
 */
import { onReady, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

import BackTop from '@/components/common/BackTop/BackTop.vue'
import ShopList from '@/components/common/ShopList/ShopList.vue'
import { useAuthRedirect, useLoadMore } from '@/composables/app'
import { ROUTES, withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { getCarouselImageUrl } from '@/platform/image'
import { navigateTo } from '@/platform/navigation'
import { getFoodCategoryList, getShopList } from '@/services/api/api-miste'
import { useLocationStore } from '@/stores/modules/store-locations'

const LocationStore = useLocationStore()
const { isAuthenticated, redirectToLogin } = useAuthRedirect()

const FoodCategoryList = ref([])
const foodCategoryLoading = ref(true)

getFoodCategoryList()
  .then(res => FoodCategoryList.value = res)
  .finally(() => foodCategoryLoading.value = false)

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

// ========== 滚动控制 ==========
const isSticky = ref(false)
// ⚠️ 仅用于 scroll-view 受控回顶（:scroll-top）。滚动监听里【不写它】，
// 否则每帧 setData 跨线程通信 → 页面延迟/跳动。类型含 undefined：同值不触发坑，回顶先置 undefined 再设 0
const scrollTop = ref(0)
// BackTop 显隐：只维护「是否超阈值」布尔，跨点才变（false↔true 各一次），不逐帧存 scrollTop 数值
const showBackTop = ref(false)
// BackTop 显隐阈值（px）
const BACKTOP_THRESHOLD = 400
// 吸顶临界点：header 高度（px），onReady 用 createSelectorQuery 查一次
const stickyThreshold = ref(0)

// ⚠️ 高频事件：滚动时每帧触发。此处【只更新布尔】，且仅在跨越阈值/临界点那一瞬间才写响应式
// （false→true 或 true→false），中间帧完全不动 → 把每秒几十次的 setData 降到几次，治延迟跳动。
function onScroll(event) {
  const top = event.detail.scrollTop
  const over = top > BACKTOP_THRESHOLD
  if (over !== showBackTop.value)
    showBackTop.value = over

  const sticky = top >= stickyThreshold.value
  if (sticky !== isSticky.value)
    isSticky.value = sticky
}

function updateThreshold() {
  uni.createSelectorQuery()
    .select('.header-content')
    .boundingClientRect()
    .exec((result) => {
      const rect = result[0]
      if (rect?.height)
        stickyThreshold.value = rect.height
    })
}

onReady(() => {
  updateThreshold()
  refreshShopsIfLocationChanged()
})

function toShop(item) {
  const shopUrl = withQuery(ROUTES.SHOP, { shopid: item.id })
  if (!isAuthenticated.value) {
    // 带上目标商家，而不是无参跳登录——无参时回跳目标会变成首页，登录后回不到这家店
    redirectToLogin(shopUrl)
    return
  }
  navigateTo(shopUrl)
}

// ========== 加载更多 ==========
function handleLoadMore() {
  if (!isAuthenticated.value) {
    redirectToLogin()
    return
  }
  loadMore()
}

// ========== 轮播图分页 ==========
const PAGE_SIZE = 8

const paginatedFoodList = computed(() => {
  const list = FoodCategoryList.value || []
  return Array.from(
    { length: Math.ceil(list.length / PAGE_SIZE) },
    (_, i) => list.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE),
  )
})

// ========== 工具函数 ==========
/**
 * ★ /food 死链处置（修正方案 E 节的实测错误）：不跳转，toast 提示。
 * web-user 的轮播项跳 `/food`（不迁移页），其 link 里的 restaurant_category_id
 * 解析逻辑（extractIdFromUrl）随之成为死代码 → **不搬**，将来 food 页若迁移再补。
 */
function onFoodCategoryTap() {
  showToast('敬请期待')
}

// 坐标偏移阈值（约 0.01°≈1km）：小于此值视作 GPS 抖动，不重拉商家
const LOCATION_DRIFT_THRESHOLD = 0.01

function refreshShopsIfLocationChanged() {
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

// tabBar 页二次进入只触发 onShow（不销毁）→ 重查阈值（header 可能因数据变化变高）
onShow(() => {
  updateThreshold()
})

// ========== BackTop 回顶 ==========
// scroll-view 受控回顶：同值不触发坑 → 先置 undefined 再 nextTick 设 0
function scrollToTop() {
  scrollTop.value = undefined
  setTimeout(() => {
    scrollTop.value = 0
  }, 20)
}
</script>

<template>
  <view class="msite-page">
    <scroll-view
      class="msite"
      scroll-y
      :scroll-top="scrollTop"
      :lower-threshold="250"
      @scroll="onScroll"
      @scrolltolower="handleLoadMore"
    >
      <!-- 轮播图 -->
      <view class="header-content">
        <view class="swiper">
          <view
            v-if="foodCategoryLoading"
            class="swiper-placeholder"
          >
            <text>分类加载中...</text>
          </view>
          <swiper
            v-else-if="paginatedFoodList.length > 0"
            class="swiper-body"
            :indicator-dots="paginatedFoodList.length >= 2"
            :circular="paginatedFoodList.length >= 2"
            indicator-color="rgba(255,255,255,0.4)"
            indicator-active-color="#3190e8"
          >
            <swiper-item
              v-for="(page, index) in paginatedFoodList"
              :key="index"
            >
              <view class="slide-style">
                <view
                  v-for="(item, itemIndex) in page"
                  :key="itemIndex"
                  class="slide-item"
                  @click="onFoodCategoryTap(item)"
                >
                  <!-- ★ 轮播图走后端代理的 cdn 子路由（fuss10 域名收口，见文件头第 2 条） -->
                  <image
                    :src="getCarouselImageUrl(item.image_url)"
                    :aria-label="item.title"
                    class="slide-img"
                    mode="aspectFit"
                  />
                  <text class="slide-title">
                    {{ item.title }}
                  </text>
                </view>
              </view>
            </swiper-item>
          </swiper>
        </view>
      </view>

      <!-- 商家 -->
      <view class="shopping-contnet">
        <view
          class="contnet-title"
          :class="{ 'is-sticky': isSticky }"
        >
          <SvgIcon
            icon-class="contnet-title_svg"
            icon-name="shop"
          />
          附近商家
        </view>

        <ShopList
          :list="shopList"
          :loading="loading"
          :finished="finished"
          @item-click="toShop"
        />
      </view>
    </scroll-view>

    <!-- ⚠️ BackTop 必须在 scroll-view 外面：fixed 元素放进 scroll-view 会跟随内容滚动、
         定位失效；且写在 scroll-view 内部会被静态提升丢 v-show（产物退化成恒真的 wx:if），
         导致「一直显示」。移到页面根层级后由 v-if 销毁/重建控制显隐。
         ⚠️ 显隐判断已上提到父组件（showBackTop 布尔）：滚动监听只在跨越阈值瞬间更新一次，
         避免逐帧 setData 导致的延迟/跳动。BackTop 退化为纯展示 + to-top 事件。 -->
    <BackTop
      v-if="showBackTop"
      @to-top="scrollToTop"
    />
  </view>
</template>

<style lang="scss" scoped>
/* ⚠️ scroll-view 是自定义组件，在非 flex 容器里会收缩到内容宽度（不默认 100% 宽），
   导致内部商家卡片的 flex 行被压窄、布局乱掉。父容器必须显式 100% 宽，
   scroll-view 再 100% 跟随。（对照 poc-shop：它用 flex 列布局，scroll-view 靠
   align-items:stretch 拉满宽度，是另一种等价写法。） */
.msite-page {
  width: 100%;
  height: 100vh;
}

.msite {
  width: 100%;
  height: 100%;
}

.header-content {
  margin-bottom: 30rpx;
}

.swiper {
  width: 100%;

  /* 48vw = 180px → 360rpx（议题 4：vw×7.5） */
  height: 360rpx;
  border-bottom: 0.6px solid #e4e4e4; /* 发丝线不转 */
}

.swiper-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  background: #f5f5f5;
}

.swiper-body {
  width: 100%;
  height: 100%;
}

.slide-style {
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(4, 1fr);
  height: 100%;
  background: #fff;

  .slide-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .slide-img {
    width: 45%;
    height: 45%;
    margin-bottom: 14rpx;
  }

  .slide-title {
    font-size: 26rpx;
    color: #666;
    text-align: center;
  }
}

.shopping-contnet {
  background: #fff;

  .contnet-title {
    padding: 20rpx 0 20rpx 20rpx;
    font-size: 28rpx;
    color: #999;
    background: #fff;
    border-bottom: 1px solid #eee; /* ① 类 border 不转 */

    &.is-sticky {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4rpx 16rpx rgb(0 0 0 / 10%);
    }

    &_svg {
      width: 40rpx;
      height: 40rpx;
      margin-right: 10rpx;
      margin-bottom: 12rpx;
      vertical-align: middle;
      fill: #999;
    }
  }
}
</style>
