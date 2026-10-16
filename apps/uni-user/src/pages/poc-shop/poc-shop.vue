<script setup lang="ts">
/**
 * ⚠️ Batch 0.5 PoC 页 —— 临时页面，验完删除（迁移方案 J 节）
 *
 * 目的：把全项目头号技术风险（shop 的三层嵌套 sticky）前置暴露。
 * shop 占迁移范围 36%（3198 行），若排到 Batch 3 最后才发现方案不成立，会卡住收尾。
 *
 * 本页用**假数据**只验证滚动机制，不迁真实业务。三个交付物：
 * ① 方案 A 可行性：三层 sticky 是否都生效 + 左侧「sticky+固定高度+内部独立滚」
 *    三者能否同时成立 + 手势冲突 + scroll-into-view 在 184rpx 吸顶偏移下是否遮挡
 * ② 方案 B 代价量化：固定布局（两平级 scroll-view）联动是否更简单可靠
 * ③ rpx/px 混算精度：CSS 变量 rpx + JS stickyHeight px 的对齐、
 *    createSelectorQuery 返回 px 与 CSS rpx 的换算、calc(100vh - 300rpx) 混合单位、
 *    @media (width <= 360px) 断点在 rpx 体系下是否还触发
 *
 * 放主包不放分包：PoC 要量的是 sticky 行为而非体积。
 */
import { onReady } from '@dcloudio/uni-app'
import { nextTick, ref } from 'vue'

type Mode = 'A' | 'B'

const mode = ref<Mode>('A')

// ── 假数据：8 个分类 × 每类 12 个商品，足够撑出滚动 ──
const categories = Array.from({ length: 17 }, (_, ci) => ({
  id: `cat-${ci}`,
  name: `分类${ci + 1}`,
  foods: Array.from({ length: 12 }, (_, fi) => ({
    id: `food-${ci}-${fi}`,
    name: `商品${ci + 1}-${fi + 1}`,
    price: 10 + fi,
  })),
}))
console.log(categories)

const activeId = ref('cat-0')
const outerScrollTop = ref<number | undefined>(undefined)
const scrollIntoViewId = ref('')

// ── 方案 A 的吸顶偏移：CSS 变量用 rpx，JS 侧需要 px ──
// shop.scss 的 --nav-height:50px / --tab-height:42px → rpx 为 100/84，合计 184rpx
const STICKY_RPX = 184
const rpxToPxRatio = ref(0)
const stickyHeightPx = ref(0)

// ── 缓存的锚点绝对偏移（方案：批量查询 + 缓存，滚动路径零异步查询） ──
const anchorTops = ref<number[]>([])
const isProgramScrolling = ref(false)
const measureLog = ref<string[]>([])
// ⚠️ 定义在 refreshAnchors 之前（ts/no-use-before-define）：
// 锚点的「绝对偏移」= rect.top + 当前 scrollTop，必须先持有 scrollTop 缓存
const lastScrollTop = ref(0)

function log(message: string) {
  measureLog.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`)
  measureLog.value = measureLog.value.slice(0, 12)
}

function systemRatio() {
  // windowWidth / 750 是 rpx→px 的换算系数（议题 4 / Batch 0.5 ③）
  const info = uni.getSystemInfoSync()
  rpxToPxRatio.value = info.windowWidth / 750
  stickyHeightPx.value = STICKY_RPX * rpxToPxRatio.value
  log(`rpx→px 系数=${rpxToPxRatio.value.toFixed(4)}（windowWidth=${info.windowWidth}）→ stickyHeight=${stickyHeightPx.value.toFixed(1)}px`)
}

/**
 * 批量查全部锚点并缓存绝对偏移（1 次异步往返）。
 * ⚠️ boundingClientRect 返回的是 **px**，而 CSS 写的是 rpx → 用系数换算对齐。
 */
function refreshAnchors() {
  uni.createSelectorQuery()
    .selectAll('[data-category-id]')
    .boundingClientRect()
    .exec((result) => {
      const rects = (result[0] || []) as UniApp.NodeInfo[]
      anchorTops.value = rects.map(rect => (rect.top || 0) + lastScrollTop.value)
      log(`锚点缓存 ${anchorTops.value.length} 个，首个 top=${anchorTops.value[0]?.toFixed(1)}px`)
    })
}

function onOuterScroll(event: any) {
  lastScrollTop.value = event.detail.scrollTop
  if (isProgramScrolling.value) {
    return
  }
  // 同步二分：用缓存数组，滚动路径上零异步查询
  const target = lastScrollTop.value + stickyHeightPx.value
  const found = binarySearchActive(anchorTops.value, target)
  if (found && found !== activeId.value) {
    activeId.value = found
  }
}

function binarySearchActive(tops: number[], target: number): string | null {
  if (tops.length === 0) {
    return null
  }
  let low = 0
  let high = tops.length - 1
  let result = 0

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (tops[mid] <= target) {
      result = mid
      low = mid + 1
    }
    else {
      high = mid - 1
    }
  }
  return categories[result]?.id ?? null
}

/** 点左侧分类 → 右侧滚到对应分类（受控 scroll-top，先置 undefined 规避同值不触发） */
async function scrollToCategory(id: string) {
  activeId.value = id
  const index = categories.findIndex(category => category.id === id)
  const top = anchorTops.value[index]

  if (top === undefined) {
    log(`⚠️ 分类 ${id} 无缓存锚点，refreshAnchors 未跑或失败`)
    return
  }

  isProgramScrolling.value = true
  // 同值不触发坑：先设 undefined 再 nextTick 设目标值
  outerScrollTop.value = undefined
  await nextTick()
  outerScrollTop.value = Math.max(0, top - stickyHeightPx.value)

  setTimeout(() => {
    isProgramScrolling.value = false
  }, 300)
  log(`点分类 ${id} → scroll-top=${(top - stickyHeightPx.value).toFixed(1)}px`)
}

// ── ③ 混合单位与断点测量 ──
const mixedUnitProbe = ref('未测量')
const mediaProbe = ref('未测量')

function probeMixedUnits() {
  // calc(100vh - 300rpx) 是否被正确解析：读 .mixed-probe 的实际高度
  uni.createSelectorQuery()
    .select('.mixed-probe')
    .boundingClientRect()
    .exec((result) => {
      const rect = result[0] as UniApp.NodeInfo | null
      if (!rect) {
        mixedUnitProbe.value = '❌ 查不到 .mixed-probe，calc 混合单位可能未生效'
        return
      }
      const info = uni.getSystemInfoSync()
      const expected = info.windowHeight - 300 * rpxToPxRatio.value
      const diff = Math.abs((rect.height || 0) - expected)
      mixedUnitProbe.value = diff < 2
        ? `✅ calc(100vh - 300rpx) 生效：实测 ${rect.height?.toFixed(1)}px ≈ 期望 ${expected.toFixed(1)}px`
        : `❌ 混合单位偏差 ${diff.toFixed(1)}px：实测 ${rect.height?.toFixed(1)} vs 期望 ${expected.toFixed(1)}`
      log(mixedUnitProbe.value)
    })
}

function probeMediaQuery() {
  // .media-probe 在 @media (width <= 360px) 下背景变红；读它的计算样式判断断点是否触发
  // ⚠️ @dcloudio/types 里 fields() 是双参签名 (fields, callback)，callback 不能省
  const info = uni.getSystemInfoSync()
  uni.createSelectorQuery()
    .select('.media-probe')
    .fields({ computedStyle: ['backgroundColor'] }, (node) => {
      const bg = (node as { backgroundColor?: string } | null)?.backgroundColor || ''
      const triggered = /255,\s*0,\s*0|rgb\(255/.test(bg)
      mediaProbe.value = `windowWidth=${info.windowWidth}px | 断点(<=360px)触发=${triggered} | bg=${bg}`
      log(mediaProbe.value)
    })
    .exec()
}

// ── ① 三层 sticky 生效性测量 ──
function probeStickyLayers() {
  // 滚到中部后，分别查三层元素的 top：吸顶生效则 top 应等于各自的 sticky 偏移
  uni.createSelectorQuery()
    .select('.poc-tab-bar')
    .boundingClientRect()
    .select('.poc-side-menu')
    .boundingClientRect()
    .select('.poc-section-head')
    .boundingClientRect()
    .exec((result) => {
      const tab = result[0] as UniApp.NodeInfo | null
      const side = result[1] as UniApp.NodeInfo | null
      const head = result[2] as UniApp.NodeInfo | null
      const nav = STICKY_RPX / 2 * rpxToPxRatio.value // tab 栏 top = 100rpx
      const sideExpect = stickyHeightPx.value // 左侧与分类标题 top = 184rpx
      log(`第1层 tab top=${tab?.top?.toFixed(1)}px（期望≈${nav.toFixed(1)}）`)
      log(`第2层 side top=${side?.top?.toFixed(1)}px（期望≈${sideExpect.toFixed(1)}）`)
      log(`第3层 head top=${head?.top?.toFixed(1)}px（期望≈${sideExpect.toFixed(1)}，被遮则小于它）`)
    })
}

onReady(() => {
  systemRatio()
  // 等首屏渲染完再查锚点
  setTimeout(() => {
    refreshAnchors()
    probeMixedUnits()
    probeMediaQuery()
  }, 300)
})

function switchMode(next: Mode) {
  mode.value = next
  lastScrollTop.value = 0
  outerScrollTop.value = undefined
  nextTick(() => setTimeout(refreshAnchors, 300))
  log(`切换到方案 ${next}`)
}
</script>

<template>
  <view class="poc-page">
    <view class="poc-toolbar">
      <button
        size="mini"
        :class="mode === 'A' ? 'btn on' : 'btn'"
        @click="switchMode('A')"
      >
        方案A sticky
      </button>
      <button
        size="mini"
        :class="mode === 'B' ? 'btn on' : 'btn'"
        @click="switchMode('B')"
      >
        方案B 固定
      </button>
      <button
        size="mini"
        class="btn"
        @click="probeStickyLayers"
      >
        测三层吸顶
      </button>
      <button
        size="mini"
        class="btn"
        @click="refreshAnchors"
      >
        重查锚点
      </button>
    </view>

    <!-- ═══ 方案 A：保留三层 sticky（1:1 对应现有 H5 结构） ═══ -->
    <scroll-view
      v-if="mode === 'A'"
      class="outer-scroller"
      scroll-y
      :scroll-top="outerScrollTop"
      @scroll="onOuterScroll"
    >
      <view class="header-zone">
        店铺头图区（随页面滚上去）
      </view>

      <!-- 第 1 层：tab 栏吸顶 -->
      <view class="poc-tab-bar">
        <text>商品</text>
        <text>评价</text>
        <text>商家</text>
      </view>

      <view class="content-gate">
        <!-- 第 2 层：左侧分类 sticky + 固定高度 + 内部独立滚 -->
        <scroll-view
          class="poc-side-menu"
          scroll-y
        >
          <view
            v-for="category in categories"
            :key="category.id"
            :class="activeId === category.id ? 'side-item on' : 'side-item'"
            @click="scrollToCategory(category.id)"
          >
            {{ category.name }}
          </view>
        </scroll-view>

        <!-- 右侧商品：第 3 层每个分类标题吸顶 -->
        <view class="main-content">
          <view
            v-for="category in categories"
            :key="category.id"
            :data-category-id="category.id"
            class="category-section"
          >
            <view class="poc-section-head">
              {{ category.name }}
            </view>
            <view
              v-for="food in category.foods"
              :key="food.id"
              class="food-row"
            >
              <text>{{ food.name }}</text>
              <text class="price">
                ¥{{ food.price }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- ═══ 方案 B：放弃 sticky，固定布局 + 两平级 scroll-view ═══ -->
    <view
      v-else
      class="fixed-layout"
    >
      <view class="header-zone fixed">
        店铺头图（固定，不随滚动消失）
      </view>
      <view class="poc-tab-bar fixed">
        <text>商品</text>
        <text>评价</text>
        <text>商家</text>
      </view>
      <view class="two-pane">
        <scroll-view
          class="pane-side"
          scroll-y
        >
          <view
            v-for="category in categories"
            :key="category.id"
            :class="activeId === category.id ? 'side-item on' : 'side-item'"
            @click="scrollToCategory(category.id)"
          >
            {{ category.name }}
          </view>
        </scroll-view>
        <scroll-view
          class="pane-main"
          scroll-y
          :scroll-top="outerScrollTop"
          @scroll="onOuterScroll"
        >
          <view
            v-for="category in categories"
            :key="category.id"
            :data-category-id="category.id"
            class="category-section"
          >
            <view class="poc-section-head fixed-head">
              {{ category.name }}
            </view>
            <view
              v-for="food in category.foods"
              :key="food.id"
              class="food-row"
            >
              <text>{{ food.name }}</text>
              <text class="price">
                ¥{{ food.price }}
              </text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- ③ 测量探针 -->
    <!-- <view class="mixed-probe" />
    <view class="media-probe" />

    <view class="poc-log">
      <view class="log-title">
        测量日志（stickyHeight={{ stickyHeightPx.toFixed(1) }}px / {{ STICKY_RPX }}rpx）
      </view>
      <view
        v-for="(line, index) in measureLog"
        :key="index"
        class="log-line"
      >
        {{ line }}
      </view>
      <view class="log-line">
        {{ mixedUnitProbe }}
      </view>
      <view class="log-line">
        {{ mediaProbe }}
      </view>
    </view> -->
  </view>
</template>

<style lang="scss" scoped>
/* ⚠️ rpx 体系（375 基准，1px = 2rpx）。--nav-height/--tab-height 对应 shop.scss 的 50/42px */
.poc-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.poc-toolbar {
  display: flex;
  gap: 12rpx;
  padding: 12rpx;
  background: #fff;
}

.btn {
  margin: 0;
  font-size: 22rpx;
}

.btn.on {
  color: #fff;
  background: $blue;
}

/* ── 方案 A ── */
.outer-scroller {
  flex: 1;
  height: 0;
}

.header-zone {
  height: 200rpx;
  background: #cde;

  &.fixed {
    flex-shrink: 0;
  }
}

.poc-tab-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: 40rpx;
  padding: 20rpx 24rpx;
  background: #fff;

  &.fixed {
    position: static;
    flex-shrink: 0;
  }
}

.content-gate {
  display: flex;
  align-items: flex-start;
}

.poc-side-menu {
  position: sticky;

  /* 第 2 层：吸顶在 tab 栏之下。⚠️ sticky + 固定高度 + 内部独立滚 三者同时成立是 PoC 核心验证点 */
  top: 84rpx;
  width: 180rpx;
  height: calc(100vh - 84rpx);
  overflow: hidden auto;
  background: #f5f5f5;
}

.side-item {
  padding: 28rpx 16rpx;
  font-size: 24rpx;
  text-align: center;

  &.on {
    font-weight: 600;
    color: $blue;
    background: #fff;
  }
}

.main-content {
  flex: 1;
  min-width: 0;
}

.category-section {
  /* 最后一个分类撑开补丁（平台无关的物理约束）：内容不够长时无法滚到顶部 */
  &:last-child {
    min-height: calc(100vh - 300rpx);
  }
}

.poc-section-head {
  position: sticky;
  top: 84rpx;
  z-index: 5;
  padding: 16rpx 24rpx;
  font-weight: 600;
  background: rgb(255 255 255 / 95%);

  &.fixed-head {
    position: static;
  }
}

.food-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx;
  font-size: 26rpx;
  border-bottom: 1px solid #eee;
}

.price {
  color: #f60;
}

/* ── 方案 B ── */
.fixed-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;           /* 撑满视口，配合 .poc-page 的 overflow:hidden */
}

.two-pane {
  display: flex;
  flex: 1;                 /* 占据 header-zone + tab-bar 之后的剩余高度 */
  overflow: hidden;        /* 防止页面级滚动，只让两个 scroll-view 自己滚 */
}

.pane-side {
  width: 180rpx;
  height: 100%;            /* 关键：继承 .two-pane 的高度，scroll-view 才能滚 */
  background: #f5f5f5;
}

.pane-main {
  flex: 1;
  min-width: 0;
  height: 100%;            /* 关键：同上 */
}

/* ── ③ 探针 ── */
.mixed-probe {
  /* calc 混合单位探针：100vh - 300rpx。若小程序不支持混合单位，高度会异常 */
  width: 10rpx;
  height: calc(100vh - 300rpx);
  opacity: 0;
}

.media-probe {
  width: 10rpx;
  height: 10rpx;
  background: #0f0;
  opacity: 0;
}

/* ⚠️ 议题 4 ④ 类：media 断点是视口物理像素，rpx 体系下是否还触发要实测
   ★ 位置有语义：必须留在 .media-probe 基础规则之后，否则「基础绿 → 断点红」
     的覆盖关系会反转成「断点红被基础绿覆盖」，探针恒显绿色，
     C4 断点测量会得出「小程序端断点不触发」的假结论 */
@media (width <= 360px) {
  .media-probe {
    background: #f00;
  }
}

.poc-log {
  max-height: 260rpx;
  padding: 12rpx;
  overflow: auto;
  background: #222;
}

.log-title {
  font-size: 22rpx;
  color: #8f8;
}

.log-line {
  font-size: 20rpx;
  color: #ccc;
  word-break: break-all;
}
</style>
