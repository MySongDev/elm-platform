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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 67px;
  padding: 10px 12px;
  background-color: #fff;
  border-bottom: 1px solid #f1f1f1;
}

.location-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-width: 0;
  text-align: left;
  background: transparent;
  border: 0;

  &.is-clickable {
    cursor: pointer;
  }

  .location-label {
    font-size: 13px;
    line-height: 1;
    color: #999;
  }

  strong {
    @include text-ellipsis;

    max-width: 100%;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.25;
    color: #111;
  }
}

.relocate-button {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: $blue;
  white-space: nowrap;
  background: transparent;
  border: 0;

  .van-icon {
    font-size: 15px;
  }
}

.home {
  margin-top: 2.6667vw;
  border-top: 0.1vw solid #e4e4e4;

  .home_cit {
    padding: 1vw 1vw 1vw 3vw;
    font-size: 3.5vw;
    line-height: 8vw;
    color: #666;
    background-color: #fff;
    border-bottom: 0.1vw solid #e4e4e4;
  }

  .home-u {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    font-size: 3.5vw;

    .to_city {
      line-height: 10.1vw;
      color: $blue;
      text-align: center;
      background-color: #fff;
      border-right: 0.1vw solid $e4;
      border-bottom: 0.1vw solid $e4;
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
      font-size: 3.5vw;
      line-height: 8vw;
      background-color: #fff;
      border-top: 0.1vw solid #e4e4e4;
      border-bottom: 0.1vw solid #e4e4e4;

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
      @include size-color(3.75vw, #666);

      height: 10.9333vw;
      padding: 1vw 0.2vw;
      line-height: 9.3vw;
      text-align: center;
      border-right: 0.1vw solid #e4e4e4;
      border-bottom: 0.1vw solid #e4e4e4;
    }
  }
}
</style>
