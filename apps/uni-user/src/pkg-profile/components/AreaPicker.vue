<script setup>
/**
 * 三份地区表都是平铺的，不能用省码直接当city_list的键。
 * 滚动只改临时索引；确定才回填，取消回到上次确认的位置。
 */
import { areaList } from '@vant/area-data'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '所在地区',
  },
})
const emit = defineEmits(['update:modelValue'])
const provinces = Object.entries(areaList.province_list)
const provinceIdx = ref(0)
const cityIdx = ref(0)
const countyIdx = ref(0)

function getCities(index) {
  const prefix = provinces[index]?.[0].slice(0, 2)
  return prefix ? Object.entries(areaList.city_list).filter(([code]) => code.startsWith(prefix)) : []
}
function getCounties(province, city) {
  const prefix = getCities(province)[city]?.[0].slice(0, 4)
  return prefix ? Object.entries(areaList.county_list).filter(([code]) => code.startsWith(prefix)) : []
}
const cities = computed(() => getCities(provinceIdx.value))
const counties = computed(() => getCounties(provinceIdx.value, cityIdx.value))
const options = computed(() => [
  provinces.map(([, name]) => name),
  cities.value.map(([, name]) => name),
  counties.value.map(([, name]) => name),
])

function restoreSelection(value) {
  const [province, city, county] = (value || '').split('/')
  provinceIdx.value = Math.max(0, provinces.findIndex(([, name]) => name === province))
  cityIdx.value = Math.max(0, getCities(provinceIdx.value).findIndex(([, name]) => name === city))
  countyIdx.value = Math.max(0, getCounties(provinceIdx.value, cityIdx.value).findIndex(([, name]) => name === county))
}
watch(() => props.modelValue, restoreSelection, { immediate: true })

function onColumnChange({ detail }) {
  if (detail.column === 0) {
    provinceIdx.value = detail.value
    cityIdx.value = 0
    countyIdx.value = 0
  }
  else if (detail.column === 1) {
    cityIdx.value = detail.value
    countyIdx.value = 0
  }
  else if (detail.column === 2) {
    countyIdx.value = detail.value
  }
}

function onChange({ detail }) {
  const [province = 0, city = 0, county = 0] = detail.value
  const parts = [
    provinces[province]?.[1],
    getCities(province)[city]?.[1],
    getCounties(province, city)[county]?.[1],
  ]
  if (parts.some(part => !part))
    return
  provinceIdx.value = province
  cityIdx.value = city
  countyIdx.value = county
  emit('update:modelValue', parts.join('/'))
}

function onCancel() {
  restoreSelection(props.modelValue)
}
</script>

<template>
  <picker
    mode="multiSelector"
    :range="options"
    :value="[provinceIdx, cityIdx, countyIdx]"
    @columnchange="onColumnChange"
    @change="onChange"
    @cancel="onCancel"
  >
    <view class="area-picker">
      <text class="area-picker_text" :class="{ 'area-picker_placeholder': !modelValue }">
        {{ modelValue || placeholder }}
      </text>
      <text class="area-picker_arrow">
        ›
      </text>
    </view>
  </picker>
</template>

<style lang="scss" scoped>
.area-picker {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  background: #fff;
  border: 2rpx solid #ddd;
  border-radius: 12rpx;
}

.area-picker_text {
  color: #333;

  &_placeholder {
    color: #999;
  }
}

.area-picker_arrow {
  margin-left: 16rpx;
  font-size: 40rpx;
  color: #d8d8d8;
}
</style>
