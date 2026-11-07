<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/search/SearchHome.vue 同源改造。
 *
 * 差异与修正：
 * 1. ★ **X4 存量死链修正**（方案议题 5 / K 节 X4）：web-user 的搜索结果是「商家」列表，
 *    但 `<router-link :to="/profile">` 硬编码跳到「我的」页 —— 点击跳错。
 *    这里改为进 shop：`navigateTo(withQuery(ROUTES.SHOP, { shopid: item.id }))`，
 *    与 shop 页读 `route.query.shopid` 的方式对齐。
 * 2. `confirm`（ConfirmDialog 命令式挂载 DOM）→ platform/feedback 的 showConfirm
 * 3. `useAuthRedirect` 换 uni-user 版（platform/navigation 重写，API 形状一致）
 * 4. input 的 `@search` 事件小程序端不存在 → 用 `confirm-type="search"` + `@confirm`
 * 5. **内联 SVG「支付」标签简化**（H 节）：web-user 用 polygon+line+text 画梯形边框+文字，
 *    小程序端不支持 svg。三选一中选**最稳的「纯文字标签+边框」**（视觉略变）：
 *    橙色描边小标签写「支付」。转 PNG 不能跟随主题、CSS clip-path 小程序支持有限。
 * 6. `close.png` → `/static/images/close.png`（已复制；小程序本地资源走 static）
 * 7. px → rpx；⑧ 类 `@include size-color(14px, #666)` → `size-color(28rpx, #666)`
 * 8. 搜索结果商家图 `<image>` → `SmartImage`（懒加载 + 骨架屏 + 并发排队），
 *    与 ShopItem 同款。⚠️ 宿主 `.item-left` 必须给定尺寸（组件内部 width/height 100%）。
 */
import { ref, shallowRef } from 'vue'

import BaseState from '@/components/common/BaseState/BaseState.vue'
import SmartImage from '@/components/common/SmartImage/SmartImage.vue'
import { useAuthRedirect } from '@/composables/app/useAuthRedirect'
import { useStateContainer } from '@/composables/ui/useStateContainer'
import { ROUTES, withQuery } from '@/config/routes'
import { showConfirm } from '@/platform/feedback'
import { getImageUrl } from '@/platform/image'
import { navigateTo } from '@/platform/navigation'
import { searchRestaurant } from '@/services/api/api-search'
import { clearAll, getSearchHistory, removeSearchItem, setSearchHistory } from '@/utils/search/SearchHistory'

const inputValue = ref('')
const restaurantList = shallowRef([])
const searchHistory = ref([])
const searchName = 'home_searchHistory'
const { requireAuth } = useAuthRedirect()

const { state, execute: fetchShops, resetState } = useStateContainer(
  () => searchRestaurant('33.44,22.55', inputValue.value),
)

function loadHistory() {
  searchHistory.value = getSearchHistory(searchName)
}

async function sendSearch() {
  if (!inputValue.value.trim())
    return

  if (!requireAuth())
    return

  setSearchHistory(searchName, inputValue.value)
  loadHistory()

  const res = await fetchShops()
  restaurantList.value = Array.isArray(res) ? res : []
}

function inputFn() {
  if (inputValue.value !== '')
    resetState()
}

function clearRestaurantList() {
  if (!inputValue.value) {
    restaurantList.value = []
    resetState()
  }
}

function searchInput(value) {
  inputValue.value = value
  sendSearch()
}

function handleRemove(item) {
  searchHistory.value = removeSearchItem(searchName, item)
}

async function handleClearAll() {
  if (await showConfirm({ content: '确定要清除全部历史记录吗？' })) {
    clearAll(searchName)
    searchHistory.value = []
  }
}

/** ★ X4 修正：搜索结果点击进 shop（带 shopid），不再跳 /profile */
function goShop(item) {
  navigateTo(withQuery(ROUTES.SHOP, { shopid: item.id }))
}

loadHistory()
</script>

<template>
  <view>
    <view class="search-contanier">
      <input
        v-model="inputValue"
        type="text"
        confirm-type="search"
        placeholder="请输入商家或美食名称"
        class="search-input"
        @confirm="clearRestaurantList"
        @input="inputFn"
      >
      <view
        class="search-submit"
        @click="sendSearch"
      >
        搜索
      </view>
    </view>

    <BaseState
      :state="state"
      @retry="sendSearch"
    >
      <template #default>
        <view
          v-if="restaurantList.length"
          class="restaurant-content"
        >
          <text class="title-restaurant">
            商家
          </text>
          <view
            v-for="(item, index) in restaurantList"
            :key="index"
            class="restaurant-list"
            @click="goShop(item)"
          >
            <view class="list-item">
              <view class="item-left">
                <SmartImage
                  :src="getImageUrl(item.image_path)"
                  alt="餐厅图片"
                />
              </view>
              <view class="item-right">
                <view class="item-right_text">
                  <view class="name-row">
                    <text>{{ item.name }}</text>
                    <!-- ★ 内联 SVG 支付标签 → 纯文字+边框（H 节三选中最稳方案） -->
                    <text class="pay_icon">
                      支付
                    </text>
                  </view>
                  <text>月售 {{ item.month_sales || item.recent_order_num }} 单</text>
                  <text>{{ item.delivery_fee || item.float_minimum_order_amount }} 元起送 / 距离{{ item.distance }}</text>
                </view>
                <view class="item-right_detail">
                  <view
                    v-for="activities in item.activities"
                    :key="activities.id"
                    class="activity-row"
                  >
                    <text
                      :style="{ backgroundColor: `#${activities.icon_color}` }"
                      class="activities_icon"
                    >
                      {{ activities.icon_name }}
                    </text>
                    <text>{{ activities.name }}</text>
                    <text class="only-phone">
                      (手机客户端专享)
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>
    </BaseState>

    <view
      v-if="!inputValue"
      class="search-history"
    >
      <text class="search-history_title">
        搜索历史
      </text>
      <view class="search-history_content">
        <view
          v-for="(item, index) in searchHistory"
          :key="index"
          class="search-history_text"
          @click="searchInput(item)"
        >
          {{ item }}
          <view
            class="search-history_clear-img"
            @click.stop="handleRemove(item)"
          >
            <image
              src="/static/images/close.png"
              mode="aspectFit"
              aria-label="删除"
            />
          </view>
        </view>
        <view
          v-show="searchHistory?.length"
          class="search-history_clear-all"
          @click="handleClearAll"
        >
          清空搜索历史
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.search-contanier {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding: 24rpx;
  margin: 0 auto;
  background: $ff;
}

.search-input {
  flex: 4;
  height: 76rpx;
  padding: 0 10rpx;
  margin-right: 8rpx;
  font-size: 30rpx;
  font-weight: 700;
  background: #f2f2f2;
  border: .5px solid #e4e4e4; /* 发丝线不转（① 类 border） */
  border-radius: 8rpx;
}

.search-submit {
  flex: 1;
  max-width: 200rpx;
  padding: 0 16rpx;
  font-size: 28rpx;
  line-height: 76rpx;
  color: $ff;
  text-align: center;
  background: #3190e8;
  border-radius: 8rpx;
}

.restaurant-content {
  .title-restaurant {
    display: block;
    font-weight: bold;
    line-height: 94rpx;
    color: #666;
    text-indent: 22rpx;
    border-bottom: 1px solid #e2e2e2; /* ① 类 border 不转 */
  }
}

.restaurant-list {
  background: $ff;
  border-bottom: 1px solid #e2e2e2; /* ① 类 border 不转 */
}

.list-item {
  display: flex;
  padding: 20rpx;
}

.item-left {
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
}

.item-right {
  flex: 1;
  font-size: 28rpx;

  &_text {
    padding-bottom: 12rpx;
    line-height: 42rpx;
    border-bottom: 0.6px solid $blue; /* 发丝线不转 */
  }

  .name-row {
    display: flex;
    gap: 8rpx;
    align-items: center;
  }

  /* ★ 支付标签：纯文字+橙色描边（替代 web-user 的内联 SVG 梯形） */
  .pay_icon {
    padding: 0 8rpx;
    font-size: 20rpx;
    font-weight: bold;
    color: #ff6000;
    border: 1px solid #ff6000; /* ① 类 border 不转 */
    border-radius: 4rpx;
    transform: skewX(-8deg);
  }

  &_detail {
    padding-top: 12rpx;
    line-height: 42rpx;

    .activity-row {
      display: flex;
      gap: 8rpx;
      align-items: center;
    }

    .activities_icon {
      padding: 2rpx;
      font-size: 24rpx;
      color: $ff;
      border-radius: 7rpx;
    }

    .only-phone {
      color: #fa9052;
    }
  }
}

.search-history {
  line-height: 94rpx;

  &_title {
    /* ⑧ 类 @include 参数手工换算：size-color(14px, #666) → (28rpx, #666) */
    @include size-color(28rpx, #666);

    display: block;
    font-weight: 700;
    text-indent: 22rpx;
    background: $e4;
  }

  &_content {
    background: $ff;
  }

  &_text {
    @include text-ellipsis;

    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 20rpx;
    font-size: 32.8rpx;
    border-bottom: 1px solid #e2e2e2; /* ① 类 border 不转 */
  }

  &_clear-img {
    width: 80rpx;
    text-align: center;

    image {
      width: 32rpx;
      height: 32rpx;
    }
  }

  &_clear-all {
    font-weight: 700;
    color: #3190e8;
    text-align: center;
  }
}
</style>
