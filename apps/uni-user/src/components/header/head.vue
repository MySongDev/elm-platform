<script setup>
/**
 * ⚠️ 与 apps/web-user/src/components/header/head.vue 同源改造。
 *
 * 差异：
 * 1. **vue-router 整体作废** → 当前路径用 platform/navigation 的 getCurrentPath()
 *    （页面栈栈顶）；返回用 navigateBack()（含首页降级 switchTab 的坑处理）
 * 2. **route.meta.title 不存在**（小程序无路由元信息）→ 标题只认 headTitle prop。
 *    ⚠️ 原生导航栏的标题由 pages.json 的 navigationBarTitleText 承担；
 *    本组件只服务 navigationStyle: custom 的页面（profile/shop），它们需要自定义头
 * 3. **noBackPages 白名单修正**（方案 E 节死链）：web-user 是
 *    `['/home', '/msite', '/profile', '/']`，其中 `/home` **不迁移**（死链）→ 去掉；
 *    换成 uni-user 的 tabBar 路径（tabBar 页无「返回」语义）
 * 4. header/div/span → view/text；vw/px → rpx（×2 / ×7.5）
 * 5. 状态栏高度：custom 导航页必须避让微信胶囊与状态栏（方案 D 节）。
 *    ⚠️ 本组件顶部留出 statusBarHeight 的占位，由 platform/system 提供 ——
 *    当前先用 uni.getSystemInfoSync().statusBarHeight 内联（H5 端将来要降级，
 *    届时收口到 platform/system.ts，见方案「将来加 H5/App 时要复查的点」）
 */
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { getCurrentPath, navigateBack } from '@/platform/navigation'
import { useLocationStore } from '@/stores/modules/store-locations'

const props = defineProps({
  singUp: { // 是否显示登录图标（保留签名；登录入口在 profile 页，头部不用）
    type: Boolean,
    default: false,
  },
  headTitle: { // 中间的文字标题
    type: String,
    default: '',
  },
  showBack: { // 是否显示返回图标
    type: Boolean,
    default: true,
  },
  showSearch: { // 是否显示搜索图标
    type: Boolean,
    default: false,
  },
  theme: {
    type: String,
    default: 'primary',
    validator: value => ['primary', 'light'].includes(value),
  },
})

void props.singUp
void props.showSearch

const locationStore = useLocationStore()
const { locationText } = storeToRefs(locationStore)

// 状态栏高度（custom 导航页避让微信状态栏）
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

// 中间文字标题：只认 prop（小程序无 route.meta）
const Title = computed(() => props.headTitle || '')

function Back() {
  // navigateBack 内部已处理「首页调用会失败 → 降级 switchTab」的坑
  navigateBack()
}

// 根据当前路径动态控制头部返回按钮
const showHeaderBack = computed(() => {
  // ⚠️ 修正死链：去掉不迁移的 '/home'；tabBar 页无返回语义
  const noBackPages = ['/pages/msite/msite', '/pages/search/SearchHome', '/pages/cart/cart', '/pages/profile/profile']

  return props.showBack && !noBackPages.includes(getCurrentPath())
})

// 根据路径控制头部定位文字
const showHeaderLocation = computed(() => {
  return getCurrentPath() === '/pages/msite/msite'
})
</script>

<template>
  <view
    id="head_top"
    :class="`head-top--${theme}`"
    :style="{ paddingTop: `${statusBarHeight}px` }"
  >
    <view class="left_area">
      <slot name="logo" />
      <!-- 返回标签 -->
      <view
        v-if="showHeaderBack"
        class="head_goback"
        @click="Back"
      >
        <SvgIcon
          icon-name="arrow-left"
          class="svg"
        />
      </view>

      <slot name="title" />
      <!-- 文字标题 -->
      <text class="title_text">
        {{ Title }}
      </text>
      <!-- 定位 -->
      <template v-if="showHeaderLocation">
        <SvgIcon
          icon-name="location"
          class="svg"
        />
        <text class="location_text">
          {{ locationText }}
        </text>
      </template>
    </view>

    <view class="right_area">
      <slot name="changecity" />
      <slot name="edit" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
#head_top {
  /* 12vw = 45px → 90rpx（议题 4：vw×7.5） */
  @include wh(100%, 90rpx);

  position: relative;
  z-index: 999;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  background-color: $blue;

  .left_area {
    display: flex;
    align-items: end;
    min-width: 120rpx;

    /* ⚠️ 标签级 class（宿主节点），不是 icon-class —— 见 SvgIcon.vue 头部契约。
       web-user 原文是 `@include wh(5.6vw, 16px); fill: #fff`：
       - `fill` 对字体图标无意义（字形颜色走 `color`），改为 color
       - 字体图标的宽高由 font-size 决定（1em），width/height 不改变字形大小，
         故只保留 web-user 的高度语义 16px→32rpx；5.6vw 的宽度是 svg 盒子被拉宽的
         结果，字形本身是正方形栅格，无法等价复现（真机目视验收） */
    .svg {
      font-size: 32rpx;
      line-height: 1;
      color: rgb(255 255 255);
    }

    .title_text {
      padding-right: 10rpx;
      font-size: 40rpx;
      font-weight: 600;
      color: #fff;
    }

    .location_text {
      padding-left: 6rpx;
      font-size: 32rpx;
      color: #fff;
    }
  }

  .right_area {
    min-width: 120rpx;
    margin-left: auto;
    text-align: right;
  }
}

// 返回标签
.head_goback {
  height: 100%;
  padding-right: 6rpx;
  vertical-align: top;
}
</style>
