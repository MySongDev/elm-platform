<script setup>
/**
 * 商家详情页（2026-10-16 按美团外卖小程序样式重设计）。
 *
 * 布局：商家信息卡 → tab 栏（点菜/评价）→ 内容区。
 * 点菜 = 左分类栏 + 右商品流（双 scroll-view 平级，无嵌套滚动）；
 * 评价 = 独立 scroll-view 分页列表。底部悬浮购物车条。
 * 导航统一走原生导航栏（2026-11-07）：pages.json 不再用 navigationStyle:custom，
 * 返回按钮由微信原生提供，本页只画内容，不再有自定义返回条。
 *
 * ⚠️ 与 web-user shop.vue 的关键差异（都是小程序端硬限制或本次重设计的取舍）：
 * 1. **滚动模型重写**：web-user 是「外层 div 滚 + 三层 position:sticky」
 *    （tab 吸顶/左栏吸顶/分类标题吸顶），小程序端 sticky 支持度是 Batch 0.5 PoC
 *    的头号未验风险（batch05-poc-measure.md 的 A1-A12 全空）。本设计**不依赖 sticky**：
 *    tab 栏与左栏是 flex 固定区，只有内容区滚 → PoC 的 A 组议题整体作废，
 *    不需要等真机结论就能交付。
 * 2. **左右双向联动**：正向（点左栏 → 右栏滚到分类）用 scroll-into-view；
 *    反向（滚右栏 → 左栏高亮）用「锚点缓存 + 二分」（与 poc-shop.vue 同一套写法），
 *    滚动路径上零异步查询。程序滚动期间用 isProgramScrolling 压住反向回写，
 *    否则点「饮品」后滚动途经的每个分类都会把高亮抢回去（左栏来回闪）。
 * 3. 顶栏只留返回按钮（本次需求）；搜索/收藏/拼单不做。
 * 4. tab 只做点菜/评价两栏（本次需求）；「商家」栏不做。
 * 5. 抛物线加购动画、BackTop、骨架屏三件套不迁：动画依赖 getBoundingClientRect
 *    （小程序端要换异步 createSelectorQuery），BackTop 在内容区滚动的模型下
 *    语义变了（要监听 scroll-view 的 scrollTop），骨架屏用 BaseState 的 loading 态替代。
 * 6. 结算：写支付草稿 → navigateTo payment（与 web-user ShopCartBar.checkout 同一份
 *    草稿形状）；支付成功回到本页时在 onShow 清空本店购物车（见 useShopPageData）。
 */
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'

import { ROUTES, withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { createAuthGuard, navigateTo } from '@/platform/navigation'
import { buildPaymentCartItems, savePaymentCheckoutDraft } from '@/utils/payment'

import CartBar from './components/CartBar.vue'
import CategoryMenu from './components/CategoryMenu.vue'
import FoodItem from './components/FoodItem.vue'
import ShopHeader from './components/ShopHeader.vue'
import ShopReview from './components/ShopReview.vue'
import { useShopCart } from './composables/useShopCart'
import { useShopPageData } from './composables/useShopPageData'

const TABS = ['点菜', '评价']

const shopId = ref('')
const activeTab = ref(TABS[0])

onLoad((options) => {
  shopId.value = String(options?.shopid ?? '')
})

const {
  cartMap,
  cartList,
  totalQty,
  totalPrice,
  setShopMeta,
  add: addToCart,
  decrease: decreaseFromCart,
  clear: clearCart,
} = useShopCart(shopId)

const {
  shopData,
  foodMenuData,
  activeCategoryId,
  pageLoading,
  loadError,
  loadShopData,
  consumePaidOrder,
} = useShopPageData(shopId, { onPaidOrderConsumed: clearCart })

// 鉴权兜底：与占位页同（迁移方案 E 节，onShow 而非 onLoad）
const authGuard = createAuthGuard('/pkg-shop/shop')

onShow(() => {
  authGuard()
  // 从支付结果页返回时清空本店购物车（onLoad 不会重跑，只能在 onShow 查）
  consumePaidOrder()
})

watch(
  shopData,
  (shop) => {
    if (!shop || !shopId.value) {
      return
    }

    setShopMeta({
      shopName: shop.name,
      deliveryFee: shop.float_delivery_fee || 0,
      minAmount: shop.float_minimum_order_amount || 20,
      deliveryTime: shop.order_lead_time ? `${shop.order_lead_time}分钟` : '',
      distance: shop.distance,
    })
  },
  { immediate: true },
)

// ============ 点菜 tab：左右联动 ============

// scroll-into-view 的目标 id。
// ⚠️ 同值不触发（web-user 的 A9 坑）：小程序端只有绑定值相对**上一次渲染**
//    发生变化才会滚动，连点同一分类第二次就是 no-op。
//    nextTick 里「先清空再赋值」不够——两次写在同一渲染周期会被合并成一次，
//    值看起来没变过。必须让空值真正提交一次渲染，故用 setTimeout(0) 隔开两拍。
const menuScrollViewId = ref('')
let scrollTimer = null

// 反向联动状态（非响应式：scroll 事件每帧触发，写 ref 会触发无谓的 setData）
let anchorTops = []
let isProgramScrolling = false
let programScrollTimer = null

// getCurrentInstance 只能在 setup 同步阶段调用，exec 回调里再取就是 null
const instance = getCurrentInstance()

/**
 * 批量查全部分类块的 top，换算成「相对 scroll-view 内容顶部」的偏移并缓存。
 *
 * 换算：块在内容里的偏移 = 块的视口 top − scroll-view 的视口 top + 当前 scrollTop。
 * 同一次 exec 里同时查容器与 scrollOffset，三个量取自同一帧，不会错位。
 * 只在菜单数据变化、切回点菜 tab 时重查：菜品图是固定 156rpx 宽高，图片加载
 * 不会改变块高度，所以滚动途中锚点不会过时。查询发生在渲染前时结果为空数组，
 * onMenuScroll 第一次滚动时会补查。
 */
function refreshAnchors() {
  const query = uni.createSelectorQuery().in(instance?.proxy)
  query.select('.menu-area__list').boundingClientRect()
  query.select('.menu-area__list').scrollOffset()
  query.selectAll('.food-category').boundingClientRect()
  query.exec((result) => {
    const [listRect, offset, catRects] = result || []
    if (!listRect || !Array.isArray(catRects)) {
      return
    }
    const scrollTop = offset?.scrollTop || 0
    anchorTops = catRects.map(rect => rect.top - listRect.top + scrollTop)
  })
}

// 菜单数据到位、DOM 渲染完后查一次；切回点菜 tab 时也重查（v-show 隐藏期间量不到尺寸）
watch(foodMenuData, () => nextTick(refreshAnchors))
watch(activeTab, (tab) => {
  if (tab === '点菜') {
    nextTick(refreshAnchors)
  }
})

/** 二分找「top ≤ scrollTop 的最后一个分类」。分类块按源码顺序排列，tops 单调递增 */
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
  if (isProgramScrolling) {
    return
  }
  if (anchorTops.length === 0) {
    refreshAnchors()
    return
  }

  // +1：分类块顶边正好贴在容器顶上时，浮点误差可能让 top 比 scrollTop 大一点点
  const index = findActiveIndex((event.detail?.scrollTop || 0) + 1)
  const id = foodMenuData.value[index]?.id

  // 只在跨分类那一瞬间写响应式（与 msite.vue 吸顶判断同一原则），中间帧不 setData
  if (id != null && String(id) !== String(activeCategoryId.value)) {
    activeCategoryId.value = id
  }
}

/** 滚到底：最后一个分类可能不够高、顶边永远到不了容器顶 → 直接高亮最后一个 */
function onMenuScrollToLower() {
  if (isProgramScrolling) {
    return
  }
  const last = foodMenuData.value.at(-1)
  if (last) {
    activeCategoryId.value = last.id
  }
}

function onCategorySelect(id) {
  activeCategoryId.value = id

  // 程序滚动期间压住反向联动：滚动途经的分类不许把高亮抢回去。
  // 500ms 覆盖 scroll-with-animation 的动画时长（微信默认约 300ms）
  isProgramScrolling = true
  if (programScrollTimer) {
    clearTimeout(programScrollTimer)
  }
  programScrollTimer = setTimeout(() => {
    isProgramScrolling = false
    programScrollTimer = null
  }, 500)

  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }

  // 第 1 拍：清空（提交一次渲染，使下个值与上一次必然不同）
  menuScrollViewId.value = ''
  // 第 2 拍：赋目标 id
  scrollTimer = setTimeout(() => {
    menuScrollViewId.value = `food-cat-${id}`
    scrollTimer = null
  }, 0)
}

// ============ 结算 ============

/**
 * 写支付草稿 → 跳 payment。草稿形状与 web-user ShopCartBar.checkout 一致，
 * payment.vue 只读草稿（shopId/shopName/deliveryFee/totalQty/goodsAmount/cartItems）。
 *
 * ⚠️ 不调 cartStore.markPendingCheckout：那是 cart 页「勾选部分商品合并结算」的机制，
 * 固定 shopId 为 `cart-checkout`；shop 页结算的是本店全部商品，支付成功后由
 * consumePaidOrder 按真实 shopId 整店清空，两条清理路径互不干扰。
 */
function onCheckout() {
  const shop = shopData.value
  const cartItems = buildPaymentCartItems(cartList.value)

  // buildPaymentCartItems 会滤掉价格为 0 / 缺 item_id 的项；全被滤掉时 payment
  // 页的 canSubmit 必为 false，与其跳过去再报「订单信息不完整」，不如在这里拦
  if (!shop || cartItems.length === 0) {
    showToast('购物车商品信息不完整，请重新选购')
    return
  }

  savePaymentCheckoutDraft({
    shopId: shopId.value,
    shopName: shop.name,
    deliveryFee: Number(shop.float_delivery_fee || 0),
    totalQty: totalQty.value,
    goodsAmount: Number(totalPrice.value || 0),
    cartItems,
  })

  navigateTo(withQuery(ROUTES.PAYMENT, {
    shopid: shopId.value,
    shopName: shop.name,
    amount: Number(totalPrice.value || 0).toFixed(2),
  }))
}

const pageState = computed(() => {
  if (pageLoading.value) {
    return 'loading'
  }
  if (loadError.value) {
    return 'error'
  }
  if (shopData.value) {
    return 'success'
  }
  return ''
})
</script>

<template>
  <view class="shop-page">
    <!--
      状态遮罩与主内容**平级**，不把主内容塞进 BaseState 的 success 插槽。
      ⚠️ 原因（2026-10-16 真机坐实）：BaseState 的根节点 `.state-container` 是
      `height:auto`，`is-active` 只在 `state !== ''` 时生效 → success 态下整条高度链
      无从计算，里面 scroll-view 的 `height:100%` 失效 → 页面滚不动。
      改成兄弟节点绝对定位覆盖后，主内容的 flex 链完全由本页掌控（.shop-body）。
    -->
    <view v-if="pageState === '' || pageState === 'success'" class="shop-body">
      <ShopHeader :shop="shopData" />

      <view class="tab-bar">
        <view
          v-for="tab in TABS"
          :key="tab"
          class="tab-item"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          <text class="tab-item__text">
            {{ tab }}
          </text>
          <view v-if="activeTab === tab" class="tab-item__underline" />
        </view>
      </view>

      <view class="content-area">
        <!-- 点菜：左分类 + 右商品流，双 scroll-view 平级 -->
        <view v-show="activeTab === '点菜'" class="menu-area">
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
                @add="addToCart"
                @decrease="decreaseFromCart"
              />
            </view>

            <!-- 末分类撑开：保证它也能被 scroll-into-view 顶到可视区 -->
            <view class="menu-area__spacer" />
          </scroll-view>
        </view>

        <ShopReview v-show="activeTab === '评价'" :shop-id="shopId" />
      </view>

      <CartBar
        :total-qty="totalQty"
        :total-price="totalPrice"
        :min-amount="shopData?.float_minimum_order_amount || 20"
        :delivery-fee="shopData?.float_delivery_fee || 0"
        @checkout="onCheckout"
      />
    </view>

    <BaseState v-else class="shop-state" :state="pageState" @retry="loadShopData" />
  </view>
</template>

<style lang="scss" scoped>
.shop-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}

/* ---- 主体：本页自己掌控 flex 链，不经过 BaseState ---- */
.shop-body {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* 非 success 态（loading/error）时遮罩铺满剩余区域。
   ⚠️ BaseState 根节点高度 auto，这里显式给绝对定位让它铺满父容器 */
.shop-state {
  position: absolute;
  inset: 0;
  z-index: 30;
}

/* ---- tab 栏 ---- */
.tab-bar {
  display: flex;
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.tab-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
  align-items: center;
  padding: 24rpx 0 16rpx;
}

.tab-item__text {
  font-size: 30rpx;
  color: #666;
}

.tab-item.active .tab-item__text {
  font-size: 32rpx;
  font-weight: 800;
  color: #222;
}

/* 美团式短下划线 */
.tab-item__underline {
  width: 40rpx;
  height: 8rpx;
  background: #ffd600;
  border-radius: 4rpx;
}

/* ---- 内容区 ---- */
.content-area {
  flex: 1;
  min-height: 0;
}

.menu-area {
  display: flex;
  height: 100%;

  /* ⚠️ 坑 10.1（uniapp-migration-diffs.md）：v-show 在 mp 端编译成 hidden 属性，
     全局 hidden 规则权重低于 scoped 的 display:flex → 不加这条，切到评价 tab 时
     点菜区不会隐藏。用权重兜底而非 v-if：v-if 会销毁 scroll-view，切回丢滚动位置 */
  &[hidden] {
    display: none !important;
  }
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

/* 末分类撑开补丁：web-user 用 min-height: calc(100vh - 150px)，
   小程序端 calc 混单位是 PoC C3 未验项 → 改纯 rpx 估值（视口约 1334rpx 高） */
.menu-area__spacer {
  height: 500rpx;
}
</style>
