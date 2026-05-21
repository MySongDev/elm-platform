<script setup>
import { Pagination } from 'swiper/modules'

import { Swiper, SwiperSlide } from 'swiper/vue'
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import BackTop from '@/components/common/BackTop/BackTop.vue'
// import ShopList from '@/components/common/ShopList/index.vue'
import ShopList from '@/components/common/ShopList/ShopList.vue'

import { useAuthRedirect, useLoadMore } from '@/composables/app'
import { useFoodCategory } from '@/composables/swr'
import { useScrollPosition } from '@/composables/ui'
// import { useElementSize } from '@/composables/ui'
import { getShopList } from '@/services/api/api-miste'
import 'swiper/css'
import 'swiper/css/pagination'

defineOptions({ name: 'Msite' })
const router = useRouter()
const { isAuthenticated, redirectToLogin } = useAuthRedirect()
const { data } = useFoodCategory()

const imgBaseUrl = 'https://fuss10.elemecdn.com'

// ========== 数据 ==========
const {
  list: shopList,
  loading,
  finished,
  loadMore,
} = useLoadMore(
  ({ page, pageSize }) => {
    const offset = (page - 1) * pageSize
    return getShopList(31.22299, 121.36025, offset, pageSize)
  },
  { pageSize: 20 },
)

// ========== Refs ==========
const msiteRef = useTemplateRef('msiteRef')
const headerRef = useTemplateRef('headerRef')
const shopListRef = useTemplateRef('shopListRef')

// 记录页面滚动位置（使用 msiteRef 作为滚动容器）
const { scrollY, saveNow } = useScrollPosition(msiteRef)

// ========== 滚动控制 ==========
const isSticky = ref(false)
const canListScroll = ref(false)

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
  // console.log(isSticky.value)
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
  const list = data.value || []
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

onMounted(() => {
  updateThreshold()

  if (msiteRef.value) {
    msiteRef.value.addEventListener('scroll', handleWindowScroll, { passive: true })
    console.log('[Msite] msiteRef mounted, scrollHeight:', msiteRef.value.scrollHeight)
    console.log('[Msite] msiteRef scrollTop:', msiteRef.value.scrollTop)
    console.log('[Msite] msiteRef clientHeight:', msiteRef.value.clientHeight)

    // 检查父元素是否可以滚动
    const parent = msiteRef.value.parentElement
    console.log('[Msite] Parent element:', parent?.className)
    if (parent) {
      console.log('[Msite] Parent scrollHeight:', parent.scrollHeight)
      console.log('[Msite] Parent scrollTop:', parent.scrollTop)
      console.log('[Msite] Parent can scroll:', parent.scrollHeight > parent.clientHeight)
    }
  }
})

onBeforeUnmount(() => {
  if (msiteRef.value) {
    msiteRef.value.removeEventListener('scroll', handleWindowScroll)
  }
})

onActivated(() => {
  // 组件激活时重置吸顶状态
  isSticky.value = false

  // 重新绑定滚动监听器
  if (msiteRef.value) {
    msiteRef.value.addEventListener('scroll', handleWindowScroll, { passive: true })
  }
})

onDeactivated(() => {
  // 组件停用时保存滚动位置（useScrollPosition 的 onBeforeRouteLeave 会自动保存）
  // 不需要手动调用 saveNow()，避免重复保存
})
// onMounted(() => console.log('✅ mounted'))
// onActivated(() => console.log('🔄 activated'))
// onDeactivated(() => console.log('💤 deactivated'))
// onBeforeUnmount(() => console.log('❌ beforeUnmount'))
// onUnmounted(() => console.log('💀 unmounted'))
</script>

<template>
  <div ref="msiteRef" class="msite">
    <!-- 轮播图 -->
    <div ref="headerRef" class="header-content">
      <div class="swiper">
        <Swiper :modules="[Pagination]" :loop="paginatedFoodList.length >= 2" :pagination="{ clickable: true }">
          <SwiperSlide v-for="(page, index) in paginatedFoodList" :key="index" class="slide-style">
            <figure v-for="(item, index) in page" :key="index" class="slide-item">
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

      <ShopList ref="shopListRef" :list="shopList" :loading="loading" :finished="finished" :page-ref="msiteRef"
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

.slide-style {
  background: #fff;
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(4, 1fr);

  .slide-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .slide-img {
    width: 45%;
    margin-bottom: 7px;
  }

  .slide-title {
    text-align: center;
    font-size: 13px;
    color: #666;
  }
}

.shopping-contnet {
  background: #fff;

  .contnet-title {
    background: #fff;
    padding: 10px 0 10px 10px;
    font-size: 14px;
    color: #999;
    border-bottom: 1px solid #eee;

    &.is-sticky {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &_svg {
      width: 20px;
      height: 20px;
      vertical-align: middle;
      margin-bottom: 6px;
      margin-right: 5px;
      fill: #999;
    }
  }
}
</style>
