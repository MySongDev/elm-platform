<script setup>
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCityInfo, searchCityInfo } from '@/services/api'

import { useLocationStore } from '@/stores/modules/store-locations'
import { clearAll, getSearchHistory, removeSearchItem, setSearchHistory } from '@/untils/SearchHistory'

defineOptions({
  name: 'CityDetail',
})

const route = useRoute()
const router = useRouter()

// 搜索返回的数据信息
const cityInfo = ref([])
// 输入文本
const inputValue = ref('')
// 城市名字
const CityName = ref('')
// 获取路由id
const CityId = route.params.id

// 搜索历史
const searchHistory = ref([])
const citySearchHis = 'citySearchHis'

// 获取搜索历史
function history() {
  const his = getSearchHistory(citySearchHis)
  searchHistory.value = his
}

// 内容输入
function inputSearch(item) {
  inputValue.value = item
  sendKeyword()
}
// 删除搜索历史
function remove(item) {
  const newArry = removeSearchItem(citySearchHis, item)
  searchHistory.value = newArry
}
// 清空所有历史记录
function clearAllHistory() {
  clearAll(citySearchHis)
  searchHistory.value = ''
}

// 发送数据
async function sendKeyword() {
  const searchTerm = inputValue.value.trim()
  if (!searchTerm)
    return // 防止重复点击

  // 执行搜索
  try {
    const res = await searchCityInfo(CityId, searchTerm)

    cityInfo.value = res
    // inputValue.value = ''

    // 保存历史
    setSearchHistory(citySearchHis, searchTerm)
    history() // 刷新历史
  }
  catch {
    // showAlert(error.message)
    // console.error('搜索失败:', error)
  }
}
// 点击小叉，触发事件
function handleSearch() {
  cityInfo.value = []
}

// 去往外卖页面
function ToMsite({ latitude, longitude, geohash }) {
  // 存入位置信息
  useLocationStore().setLocation(latitude, longitude)
  useLocationStore().geohash = geohash
  router.push({
    path: '/msite',
    query: {
      geohash,
    },
  })
}

// 获取城市数字
// route.params.id
// CityId
// 根据id,从数据内获取名字
// 调用
onBeforeMount(() => {
  if (route.query.cityname) {
    CityName.value = route.query.cityname
  }
  else {
    getCityInfo(CityId).then((res) => {
      CityName.value = res.name
    })
  }
})

// 页面挂载时获取数据
history()
</script>

<template>
  <div class="nav">
    <head-top :head-title="CityName">
      <template #changecity>
        <router-link to="/home" class="change_city">
          切换城市
        </router-link>
      </template>
    </head-top>
    <form class="city_form" @submit.prevent>
      <div>
        <input v-model="inputValue" type="search" name="city" placeholder="输入学校、商务楼、地址" class="city_input input_style"
          required @search="handleSearch">
      </div>
      <div>
        <input type="submit" name="submit" class="city_submit input_style" value="提交" @click="sendKeyword">
      </div>
    </form>

    <main v-if="cityInfo.length" class="results_container">
      <span class="results-title">附近地区</span>
      <ul>
        <li v-for="(item, index) in cityInfo" :key="index" class="city_name" @click="ToMsite(item)">
          {{ item.name }}
        </li>
      </ul>
    </main>

    <nav v-show="!inputValue" class="results_container">
      <span class="results-title">搜索历史</span>

      <ul>
        <li v-for="(item, index) in searchHistory" :key="index" class="history_style" @click="inputSearch(item)">
          {{ item }}
          <span class="remove" @click.stop="remove(item)">x</span>
        </li>
      </ul>
      <div v-if="searchHistory.length" class="clear_search_history" @click="clearAllHistory">
        清空搜索历史
      </div>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.nav {
  // padding-top: 13.3333vw;
  box-shadow: 0 0 2.6667vw $e4;

  .change_city {
    // position: absolute;
    // @include wh(16vw, 10.6667vw);

    // top: 1vw;
    // right: 2.6667vw;

    // line-height: 40px;
    @include size-color(3.7493vw, $ff);
  }

  .city_form {
    // width: 100%;
    background-color: $ff;
    border-top: 0.2667vw solid $e4;
    border-bottom: 0.2667vw solid $e4;

    div {
      // margin: 0 auto;
      text-align: center;

      .input_style {
        @include wh(90%, 8vw);

        font-size: 4.0613vw;
        border-radius: 1.3333vw;
      }

      .city_input {
        padding-left: 1.3333vw;
        margin: 4vw;
        border: 0.2667vw solid $e4;
      }

      .city_submit {
        margin-bottom: 2.6667vw;
        color: $ff;
        background-color: $blue;
      }
    }
  }

  .results_container {
    padding: 7.5px;
    font-size: 4.0613vw;

    .results-title {
      display: inline-block;
      width: 100%;
      line-height: 30px;
      border-bottom: 0.5px solid $blue;
    }
  }

  .city_name,
  .history_style {
    @include flex-center(space-between);

    height: 8vw;
    padding-left: 5.3333vw;
    margin-top: 3px;
    font-size: 4.0613vw;
    line-height: 6.9333vw;
    background-color: $ff;
    border: 0.2667vw solid $e4;
    border-radius: 1.6vw;
  }

  .remove {
    @include wh(8vw, 7vw);

    margin-right: 2.6667vw;
    font-size: 7vw;
    line-height: 6vw;
    color: #999;
    text-align: center;
    border-radius: 3vw;
  }

  .clear_search_history {
    padding: 10px 0;
    font-size: 16px;
    text-align: center;
  }
}
</style>
