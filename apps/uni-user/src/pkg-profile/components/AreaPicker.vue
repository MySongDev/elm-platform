<script setup>
/**
 * 省市区级联选择器 —— 小程序原生 `<picker mode="multiSelector">`。
 *
 * 为什么不用 uni-ui 的 cascader/picker：
 * 原生 multiSelector 不走虚拟 DOM，交互与系统弹窗一致、零额外包体积；
 * `@vant/area-data` 的数据结构（省→市→区 三级）天然匹配
 * multiSelector 的「每列选项数组 + 列间联动」模型。
 *
 * 数据形状（@vant/area-data）：
 *   areaList.province_list: { [省码]: 省名 }
 *   areaList.city_list:     { [市码]: { [省码]: 市名 } }
 *   areaList.county_list:   { [区县码]: { [市码]: 区县名 } }
 *
 * ★ 交互模型说明（原生 picker 的特殊性）：
 * picker 自身渲染出的是**触发元素**（slot 内容），弹窗由其**内部**管理；
 * 父级想「点按钮弹起选择器」，标准写法是给**包裹 picker 的那层**绑事件
 * （uni-app 编译器把外层 tap 转发给原生弹窗的 open action）。
 * 所以本组件**自带触发行样式**（外观等同 FormInput 的只读行），
 * 由父页面直接 `<AreaPicker v-model="form.detail" />` 使用，不需要再包一层。
 *
 * ⚠️ 与 web-user（van-area + van-popup）的降级差异：
 * - 不展示「已选层级」的独立 summary 文案行；选中即回写 form.detail（/ 分隔）
 * - 未选择过时三列都是空，弹窗打开定位在第 0 项（web-user 的 van-area 同样默认第 0 项，
 *   行为一致）
 */
import { areaList } from '@vant/area-data'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  /** 当前已选值，形如 '省名/市名/区名'（与 form.detail 的写入格式一致） */
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

const provinceList = Object.values(areaList.province_list)
const provinceCodes = Object.keys(areaList.province_list)

// 三列当前索引（未选过时全 0，与 web-user van-area 默认行为一致）
const provinceIdx = ref(0)
const cityIdx = ref(0)
const countyIdx = ref(0)

// 从 modelValue（'省/市/区' 拼接文案）反查索引，用于打开弹窗时定位到已选层级
watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      provinceIdx.value = 0
      cityIdx.value = 0
      countyIdx.value = 0
      return
    }
    const [prov, city, county] = val.split('/')

    const pIdx = provinceList.indexOf(prov)
    if (pIdx >= 0)
      provinceIdx.value = pIdx

    const cityMap = areaList.city_list[provinceCodes[provinceIdx.value]] || {}
    const cIdx = Object.values(cityMap).indexOf(city)
    if (cIdx >= 0)
      cityIdx.value = cIdx

    const cityCode = Object.keys(cityMap)[cityIdx.value] ?? ''
    const countyMap = areaList.county_list[cityCode] || {}
    const rIdx = Object.values(countyMap).indexOf(county)
    if (rIdx >= 0)
      countyIdx.value = rIdx
  },
  { immediate: true },
)

const cityColumn = computed(() =>
  Object.values(areaList.city_list[provinceCodes[provinceIdx.value]] || {}),
)

const countyColumn = computed(() => {
  const cityCode = Object.keys(areaList.city_list[provinceCodes[provinceIdx.value]] || {})[cityIdx.value]
  if (!cityCode)
    return []
  return Object.values(areaList.county_list[cityCode] || {})
})

const options = computed(() => [
  provinceList,
  cityColumn.value,
  countyColumn.value,
])

// 列间联动：原生 picker 的 change 事件带 { column, value }，
// 上列变化时重置其下游列到 0（否则会出现「选了 A 省却停留在 B 省的第 3 市」的错位）
function onColumnChange(e) {
  const { column } = e.detail

  if (column === 0) {
    provinceIdx.value = e.detail.value
    cityIdx.value = 0
    countyIdx.value = 0
  }
  else if (column === 1) {
    cityIdx.value = e.detail.value
    countyIdx.value = 0
  }
  else if (column === 2) {
    countyIdx.value = e.detail.value
  }
}

// 确定：回写 '省/市/区'（直辖市下市=区 的层级会在数据里重复，filter 掉空值即可，
// 直接 join 与 web-user 的 selectedOptions.map(i => i.text).join('/') 等价）
function onConfirm() {
  const parts = [
    provinceList[provinceIdx.value],
    cityColumn.value[cityIdx.value],
    countyColumn.value[countyIdx.value],
  ].filter(Boolean)
  emit('update:modelValue', parts.join('/'))
}

function onCancel() {
  // 不产生新值，保留当前列状态（与 web-user van-area 的 @cancel 行为一致）
}

// 触发行展示文案
const displayText = computed(() => props.modelValue || '')
</script>

<template>
  <picker
    mode="multiSelector"
    :range="options"
    :value="[provinceIdx, cityIdx, countyIdx]"
    @change="onColumnChange"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <view class="area-picker">
      <text class="area-picker_text" :class="{ 'area-picker_placeholder': !displayText }">
        {{ displayText || placeholder }}
      </text>
      <text class="area-picker_arrow">
        ›
      </text>
    </view>
  </picker>
</template>

<style lang="scss" scoped>
/* 外观对齐 FormInput 的只读行：白底 + 边框，让「所在地区」与其它输入项视觉统一 */
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

/* ⚠️ 标签级 class + font-size 决定字形大小（见 components/SvgIcon 的契约）；
   这里箭头直接用字符 ›，不需要 SvgIcon */
.area-picker_arrow {
  margin-left: 16rpx;
  font-size: 40rpx;
  color: #d8d8d8;
}
</style>
