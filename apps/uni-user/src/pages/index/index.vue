<script setup lang="ts">
import type { ProbeStatus } from './probes'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { API_BASE_URL } from '@/config'
import { CanceledError, request, send, TransportError } from '@/platform/request'
import { getStore, removeStore, setStore } from '@/platform/storage'
import { useBatch0Store } from '@/stores/modules/store-batch0'
import { createProbes } from './probes'

/** 单一清单：auto 项已有结论，runtime/manual 项由下方交互或人工更新 */
const probes = ref(createProbes())

function setProbe(id: number, status: ProbeStatus, detail?: string) {
  const item = probes.value.find(probe => probe.id === id)
  if (!item) {
    return
  }
  item.status = status
  if (detail) {
    item.detail = detail
  }
}

// ── 第 1 项：uni-ui / easycom ──
const popupRef = ref<any>(null)
const popupOpened = ref(false)

function openPopup() {
  popupRef.value?.open?.('center')
  popupOpened.value = true
  setProbe(1, 'pass', 'uni-icons × 3 已渲染（顶部）+ uni-popup 已成功弹出 → easycom 自动导入生效 ✓（两个组件均未手动 import）')
}

function closePopup() {
  popupRef.value?.close?.()
  popupOpened.value = false
}

// ── iconfont 目视区（第 1 项的字体图标部分） ──
// 抽几个有代表性的单色图标；backtop 同时验证 H 节的「重复实现消解」
// （web-user 的 BackTop.vue:81-83 内联手绘了上箭头，icons/svg/backtop.svg 已有同图标）
const fontIcons = ['cart', 'search', 'user', 'backtop', 'star', 'location', 'order', 'shop']
// 多色图标：SvgIcon 内部按 MULTICOLOR_ICONS 清单自动走 PNG，调用方不需传 multicolor
const pngIcons = ['fengniao', 'cart-icon', 'sdk_icon_zhifubao']

// ── 第 2 项：pinia + storage ──
const store = useBatch0Store()
const { count, label } = storeToRefs(store)

const piniaDetail = ref('')
const storageEcho = ref('')

function verifyStorage(): boolean {
  const key = 'uni_user_batch0_storage'
  const payload = {
    n: 42,
    s: '中文与符号 OK',
    nested: [1, 2, 3],
  }
  setStore(key, payload)
  const read = getStore<typeof payload>(key)
  const roundTripOk = JSON.stringify(read) === JSON.stringify(payload)

  // ⚠️ 不存在的 key：uni.getStorageSync 返回 '' 而非 null，必须确认调用方拿到的是 falsy
  removeStore(key)
  const missing = getStore('uni_user_batch0_missing_key')
  const missingIsFalsy = !missing

  storageEcho.value = roundTripOk && missingIsFalsy
    ? `往返一致 OK | 缺失 key 返回 ${JSON.stringify(missing)}（falsy OK）`
    : `往返${roundTripOk ? '一致' : '不一致 FAIL'} | 缺失 key 返回 ${JSON.stringify(missing)}`
  return roundTripOk && missingIsFalsy
}

function verifyPinia() {
  store.increment()
  const storageOk = verifyStorage()
  const ok = count.value > 0 && label.value === 'pinia-probe' && storageOk
  piniaDetail.value = ok
    ? `setup 式 defineStore OK | storeToRefs OK | count=${count.value} | label=${label.value}`
    : `异常: count=${count.value} label=${label.value} storageOk=${storageOk}`
  setProbe(2, ok ? 'pass' : 'fail', `${piniaDetail.value}；storage：${storageEcho.value}`)
}

// ── 第 4 项：uni.request 打通真实接口 ──
const networkDetail = ref('')

async function verifyNetwork() {
  setProbe(4, 'pending', '请求中…')
  try {
    const res = await request<any>({ url: '/v1/cities' })
    const body = res.data
    // 后端 elm 端点用 rawResponse 包装，形态可能是数组或 { data: [] }
    const list = Array.isArray(body) ? body : body?.data
    const total = Array.isArray(list) ? list.length : 0
    const ok = res.status === 200 && total > 0
    networkDetail.value = ok
      ? `GET /v1/cities -> ${res.status} | ${total} 条城市 | 首条 ${JSON.stringify(list[0]).slice(0, 70)}`
      : `状态 ${res.status} 但未解析出数组，响应片段: ${JSON.stringify(body).slice(0, 140)}`
    setProbe(4, ok ? 'pass' : 'fail', networkDetail.value)
  }
  catch (error) {
    if (error instanceof TransportError) {
      networkDetail.value = `TransportError: status=${error.status} isNetworkError=${error.isNetworkError} msg=${error.message}`
      setProbe(4, 'fail', `${networkDetail.value}。若 isNetworkError=true：检查后端是否在 ${API_BASE_URL} 运行、开发者工具是否已关「校验合法域名」`)
    }
    else {
      networkDetail.value = `异常: ${String(error)}`
      setProbe(4, 'fail', networkDetail.value)
    }
  }
}

// ── 第 5 项：AbortController -> RequestTask.abort ──
const abortDetail = ref('')

async function verifyAbort() {
  setProbe(5, 'pending', '发起请求并立即取消…')
  const controller = new AbortController()
  const handle = send<any>({
    url: '/v1/cities',
    signal: controller.signal,
  })

  // 立即取消：应 reject CanceledError，且不触发 success 回调
  controller.abort()

  try {
    await handle.promise
    abortDetail.value = '请求竟然成功了 -> abort 未生效 FAIL'
    setProbe(5, 'fail', abortDetail.value)
  }
  catch (error) {
    const isCanceled = error instanceof CanceledError
    // ⚠️ 关键判据：取消不能被误判成网络错误，否则 policies 重试会把主动取消当失败重试
    const notNetworkError = !(error instanceof TransportError && error.isNetworkError)
    const ok = isCanceled && notNetworkError
    abortDetail.value = ok
      ? `已取消 OK | 抛 CanceledError(isCanceled=${(error as CanceledError).isCanceled}) | 未误判为网络错误`
      : `取消后抛出的不是 CanceledError: ${String(error)}`
    setProbe(5, ok ? 'pass' : 'fail', abortDetail.value)
  }
}
</script>

<template>
  <view class="probe-page">
    <view class="hero">
      <view class="hero-title">
        Batch 0 骨架验证
      </view>
      <view class="hero-sub">
        uni-app 3.0.0-5020620260917001 / vue 3.4.21 / pinia 2.1.7 / vite 5.2.8
      </view>

      <!-- 第 1 项：uni-icons，由 easycom 自动导入，本文件未手动 import -->
      <view class="hero-icons">
        <uni-icons
          type="spinner-cycle"
          size="22"
          color="#ffffff"
        />
        <uni-icons
          type="checkmarkempty"
          size="22"
          color="#ffffff"
        />
        <uni-icons
          type="cart"
          size="22"
          color="#ffffff"
        />
        <text class="hero-icon-label">
          uni-icons x 3（easycom）
        </text>
      </view>
    </view>

    <view class="card">
      <view class="card-title">
        iconfont 字体图标（第 1 项 · 需目视）
      </view>
      <view class="icon-grid">
        <view
          v-for="name in fontIcons"
          :key="name"
          class="icon-cell"
        >
          <SvgIcon
            :icon-name="name"
            color="#3190e8"
          />
          <text class="icon-name">
            {{ name }}
          </text>
        </view>
      </view>
      <view class="card-title icon-sub">
        多色 PNG 兜底（字体丢色，走 /static/icons-png/）
      </view>
      <view class="icon-grid">
        <view
          v-for="name in pngIcons"
          :key="name"
          class="icon-cell"
        >
          <SvgIcon :icon-name="name" />
          <text class="icon-name">
            {{ name }}
          </text>
        </view>
      </view>
      <view class="detail">
        字体图标应显示为蓝色线框图形；若显示为空白方块/豆腐块，说明 @font-face 的 base64 未生效。多色图标应保留原色（蜂鸟蓝、支付宝蓝）。
      </view>
    </view>

    <view class="card">
      <view class="card-title">
        运行时验证
      </view>

      <view class="btn-row">
        <button
          class="btn btn-primary"
          size="mini"
          @click="verifyPinia"
        >
          2. pinia + storage
        </button>
        <button
          class="btn btn-primary"
          size="mini"
          @click="verifyNetwork"
        >
          4. 请求 /v1/cities
        </button>
      </view>
      <view class="btn-row">
        <button
          class="btn btn-primary"
          size="mini"
          @click="verifyAbort"
        >
          5. abort 取消
        </button>
        <button
          class="btn"
          size="mini"
          @click="openPopup"
        >
          1. 打开 uni-popup
        </button>
      </view>

      <view
        v-if="piniaDetail"
        class="detail"
      >
        pinia: {{ piniaDetail }}
      </view>
      <view
        v-if="storageEcho"
        class="detail"
      >
        storage: {{ storageEcho }}
      </view>
      <view
        v-if="networkDetail"
        class="detail"
      >
        network: {{ networkDetail }}
      </view>
      <view
        v-if="abortDetail"
        class="detail"
      >
        abort: {{ abortDetail }}
      </view>
      <view class="detail">
        后端地址: {{ API_BASE_URL }}
      </view>
    </view>

    <view class="card">
      <view class="card-title">
        Batch 0 验收清单
      </view>
      <view
        v-for="probe in probes"
        :key="probe.id"
        class="probe-item"
      >
        <view class="probe-head">
          <text class="probe-dot" :class="[`dot-${probe.status}`]">
            ●
          </text>
          <text class="probe-title">
            {{ probe.id }}. {{ probe.title }}
          </text>
          <text class="probe-kind">
            {{ probe.kind }}
          </text>
        </view>
        <view class="probe-detail">
          {{ probe.detail }}
        </view>
      </view>
    </view>

    <uni-popup
      ref="popupRef"
      type="center"
    >
      <view class="popup-box">
        <view class="popup-title">
          uni-popup 渲染成功
        </view>
        <view class="popup-text">
          由 easycom 自动导入，未手动 import。opened={{ popupOpened }}
        </view>
        <button
          class="btn btn-primary"
          size="mini"
          @click="closePopup"
        >
          关闭
        </button>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
/* ⚠️ uni-user 原生编写，单位直接用 rpx（375 设计稿基准，1px = 2rpx） */
.probe-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 24rpx;
}

.hero {
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
  background: linear-gradient(135deg, #3190e8, #5aa9f0);
  border-radius: 16rpx;
}

.hero-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #fff;
}

.hero-sub {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgb(255 255 255 / 85%);
}

.hero-icons {
  display: flex;
  gap: 24rpx;
  align-items: center;
  margin-top: 24rpx;
}

.hero-icon-label {
  font-size: 22rpx;
  color: rgb(255 255 255 / 90%);
}

.card {
  padding: 24rpx;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 16rpx;
}

.card-title {
  margin-bottom: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.btn {
  margin: 0;
  font-size: 24rpx;
}

.btn-primary {
  color: #fff;
  background: $blue;
}

.detail {
  padding: 12rpx 16rpx;
  margin-bottom: 12rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #555;
  word-break: break-all;
  background: #f7f8fa;
  border-radius: 8rpx;
}

.probe-item {
  padding: 16rpx 0;
  border-bottom: 1px solid #eee;
}

.probe-head {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

.probe-dot {
  font-size: 20rpx;
}

.dot-pass {
  color: #07c160;
}

.dot-fail {
  color: #ee0a24;
}

.dot-pending {
  color: #ff976a;
}

.dot-info {
  color: #969799;
}

.probe-title {
  flex: 1;
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

.probe-kind {
  padding: 2rpx 12rpx;
  font-size: 20rpx;
  color: #969799;
  background: #f2f3f5;
  border-radius: 20rpx;
}

.probe-detail {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #666;
  word-break: break-all;
}

.popup-box {
  width: 560rpx;
  padding: 40rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

.popup-text {
  margin: 24rpx 0;
  font-size: 24rpx;
  color: #666;
  text-align: center;
}
</style>
