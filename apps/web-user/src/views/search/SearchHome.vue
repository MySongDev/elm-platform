<script setup>
import { ref, shallowRef } from 'vue'

import BaseState from '@/components/common/BaseState/BaseState.vue'
import { confirm } from '@/components/common/ConfirmDialog/index'
import { useAuthRedirect } from '@/composables/app'
import { useStateContainer } from '@/composables/ui'
import { getImageUrl } from '@/config'
import { searchRestaurant } from '@/services/api/api-search'
import { clearAll, getSearchHistory, removeSearchItem, setSearchHistory } from '@/untils/SearchHistory'

defineOptions({
  name: 'SearchHome',
})

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
  if (await confirm('确定要清除全部历史记录吗？')) {
    clearAll(searchName)
    searchHistory.value = []
  }
}

loadHistory()
</script>

<template>
  <div>
    <div class="search-contanier">
      <input v-model="inputValue" type="search" name="search" placeholder="请输入商家或美食名称" class="search-input"
        @search="clearRestaurantList" @input="inputFn">
      <button class="search-submit" @click="sendSearch">
        搜索
      </button>
    </div>

    <BaseState :state="state" @retry="sendSearch">
      <template #default>
        <div v-if="restaurantList.length" class="restaurant-content">
          <h4 class="title-restaurant">
            商家
          </h4>
          <router-link v-for="(item, index) in restaurantList" :key="index" to="/profile" class="restaurant-list">
            <li class="list-item">
              <div class="item-left">
                <img :src="getImageUrl(item.image_path)" alt="餐厅图片">
              </div>
              <div class="item-right">
                <div class="item-right_text">
                  <p>
                    <span>{{ item.name }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="14" class="pay_icon">
                      <polygon points="0,14 4,0 24,0 20,14" style="fill:none;stroke:#FF6000;stroke-width:1" />
                      <line x1="1.5" y1="12" x2="20" y2="12" style="stroke:#FF6000;stroke-width:1.5" />
                      <text x="3.5" y="9" style="fill:#FF6000;font-size:9;font-weight:bold;">支付</text>
                    </svg>
                  </p>
                  <p>月售 {{ item.month_sales || item.recent_order_num }} 单</p>
                  <p>{{ item.delivery_fee || item.float_minimum_order_amount }} 元起送 / 距离{{ item.distance }}</p>
                </div>
                <ul class="item-right_detail">
                  <li v-for="activities in item.activities" :key="activities.id">
                    <span :style="{ backgroundColor: `#${activities.icon_color}` }" class="activities_icon">
                      {{ activities.icon_name }}
                    </span>
                    <span>{{ activities.name }}</span>
                    <span class="only-phone">(手机客户端专享)</span>
                  </li>
                </ul>
              </div>
            </li>
          </router-link>
        </div>
      </template>
    </BaseState>

    <div v-if="!inputValue" class="search-history">
      <h2 class="search-history_title">
        搜索历史
      </h2>
      <div class="search-history_content">
        <div v-for="(item, index) in searchHistory" :key="index" class="search-history_text" @click="searchInput(item)">
          {{ item }}
          <div class="search-history_clear-img" @click.stop="handleRemove(item)">
            <img src="./image/close.png" alt="删除">
          </div>
        </div>
        <div v-show="searchHistory?.length" class="search-history_clear-all" @click="handleClearAll">
          清空搜索历史
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-contanier {
  width: 100%;
  background: $ff;
  padding: 12px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
}

.search-input {
  flex: 4;
  height: 38px;
  border: .5px solid #e4e4e4;
  border-radius: 4px;
  margin-right: 4px;
  padding: 0 5px;
  background: #f2f2f2;
  font-size: 15px;
  font-weight: 700;
}

.search-submit {
  flex: 1;
  padding: 0 8px;
  background: #3190e8;
  color: $ff;
  border-radius: 4px;
  max-width: 100px;
}

.restaurant-content {
  .title-restaurant {
    border-bottom: 1px solid #e2e2e2;
    color: #666;
    text-indent: 11px;
    font-weight: bold;
    line-height: 47px;
  }
}

.restaurant-list {
  background: $ff;
  border-bottom: 1px solid #e2e2e2;
}

.list-item {
  padding: 10px;
  display: flex;
}

.item-left {
  margin-right: 10px;

  img {
    width: 60px;
    height: 60px;
    object-fit: cover;
  }
}

.item-right {
  font-size: 14px;
  flex: 1;

  &_text {
    line-height: 21px;
    border-bottom: 0.6px solid $blue;
    padding-bottom: 5.85px;

    svg {
      margin-left: 4px;
    }
  }

  &_detail {
    padding-top: 5.85px;
    line-height: 21px;

    span {
      vertical-align: middle;
      margin-right: 4px;
    }

    .activities_icon {
      padding: 1px;
      font-size: 12px;
      color: $ff;
      border-radius: 3.5px;
    }

    .only-phone {
      color: #FA9052;
    }
  }
}

.search-history {
  line-height: 46.88px;

  &_title {
    background: $e4;
    text-indent: 11px;
    @include size-color(14px, #666);
    font-weight: 700;
  }

  &_content {
    background: $ff;
  }

  &_text {
    padding: 0 0 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    @include text-ellipsis;
    font-size: 16.4px;
    border-bottom: 1px solid #e2e2e2;
  }

  &_clear-img {
    width: 40px;
    text-align: center;
  }

  &_clear-all {
    color: #3190e8;
    text-align: center;
    font-weight: 700;
  }
}
</style>
