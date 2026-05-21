<script setup>
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

import { useHomeLocation } from '@/composables/features/home'
import { useCities } from '@/composables/swr'
import { getHotCity } from '@/services/api'

defineOptions({
  name: 'Home',
})

const router = useRouter()
const { data: cities } = useCities()
const {
  locationStore,
  locationText,
  canEnterMsite,
  setCityLocation,
  loadCurrentLocation,
} = useHomeLocation()

const hotCityList = shallowRef([])

getHotCity().then((res) => {
  hotCityList.value = res
})

function nextPage(item, navigate) {
  setCityLocation(item.latitude, item.longitude, {
    city: item.name,
    cityId: item.id,
    geohash: item.geohash,
  })
  navigate()
}

function enterMsite() {
  if (!canEnterMsite.value)
    return

  router.push({
    path: '/msite',
    query: locationStore.geohash ? { geohash: locationStore.geohash } : {},
  })
}

onMounted(loadCurrentLocation)
</script>

<template>
  <div>
    <head-top :sing-up="true">
      <template #logo>
        <div class="logo_name">
          elm.me
        </div>
      </template>
    </head-top>
    <nav class="home_nav">
      <button class="location-card" type="button" :class="{ 'is-clickable': canEnterMsite }" @click="enterMsite">
        <span class="location-label">当前定位</span>
        <strong>{{ locationText }}</strong>
      </button>
      <button class="relocate-button" type="button" @click="loadCurrentLocation">
        <van-icon name="aim" />
        <span>重新定位</span>
      </button>
    </nav>
    <div class="home">
      <h4 class="home_cit">
        热门城市
      </h4>
      <ul class="home-u">
        <router-link v-for="item in hotCityList" :key="item.id" v-slot="{ navigate }"
          :to="{ path: `/city/${item.id}`, query: { cityname: item?.name } }" custom>
          <li class="to_city" @click="nextPage(item, navigate)">
            {{ item.name }}
          </li>
        </router-link>
      </ul>

      <ul class="city_list">
        <li v-for="(value, key, index) in cities" :key="key" class="city_li">
          <h4 class="city_title">
            {{ key }}
            <span v-if="index === 0">（按字母排序）</span>
          </h4>
          <ul class="groupcity_name_container citylistul">
            <router-link v-for="item in value" :key="item.id" v-slot="{ navigate }"
              :to="{ path: `/city/${item.id}`, query: { cityname: item?.name } }" custom>
              <li class="ellipsis" @click="nextPage(item, navigate)">
                {{ item.name }}
              </li>
            </router-link>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logo_name {
  color: #fff;
}

.home_nav {
  width: 100%;
  min-height: 67px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #fff;
  border-bottom: 1px solid #f1f1f1;
}

.location-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  border: 0;
  background: transparent;
  text-align: left;

  &.is-clickable {
    cursor: pointer;
  }

  .location-label {
    color: #999;
    font-size: 13px;
    line-height: 1;
  }

  strong {
    max-width: 100%;
    color: #111;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.25;
    @include text-ellipsis;
  }
}

.relocate-button {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: $blue;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  .van-icon {
    font-size: 15px;
  }
}

.home {
  margin-top: 2.6667vw;
  border-top: 0.1vw solid #e4e4e4;

  .home_cit {
    padding: 1vw 1vw 1vw 3vw;
    border-bottom: 0.1vw solid #e4e4e4;
    background-color: #fff;
    color: #666;
    font-size: 3.5vw;
    line-height: 8vw;
  }

  .home-u {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    font-size: 3.5vw;

    .to_city {
      border-bottom: 0.1vw solid $e4;
      border-right: 0.1vw solid $e4;
      color: $blue;
      line-height: 10.1vw;
      text-align: center;
      background-color: #fff;
    }
  }
}

.city_list {
  .city_li {
    margin-top: 2.6667vw;
    background-color: $ff;

    .city_title {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 1vw 1vw 1vw 2.6667vw;
      border-top: 0.1vw solid #e4e4e4;
      border-bottom: 0.1vw solid #e4e4e4;
      background-color: #fff;
      line-height: 8vw;
      font-size: 3.5vw;

      span {
        font-size: 3vw;
      }
    }
  }

  .citylistul {
    display: grid;
    grid-template-columns: repeat(4, 1fr);

    .ellipsis {
      @include text-ellipsis;
      height: 10.9333vw;
      padding: 1vw 0.2vw;
      border-bottom: 0.1vw solid #e4e4e4;
      border-right: 0.1vw solid #e4e4e4;
      text-align: center;
      line-height: 9.3vw;
      @include size-color(3.75vw, #666);
    }
  }
}
</style>
