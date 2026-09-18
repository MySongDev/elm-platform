<script setup>
// import { usePageTitle } from '@/composables/usePageTitle';

import { computed } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { useLocationStore } from '@/stores/modules/store-locations'

// const { singUp, headTitle, goback = 'true' } = defineProps(['singUp', 'headTitle', 'goback'])
const props = defineProps({
  singUp: { // 是否显示登录图标
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
const router = useRouter()
const route = useRoute()

const locationStore = useLocationStore()
const { locationText } = storeToRefs(locationStore)

// 中间文字标题
const Title = computed(() => {
  // 1. 优先使用 props 传入的标题
  if (props.headTitle) {
    return props.headTitle
  }

  // 2. 其次从路由元信息获取
  if (route.meta?.title) {
    return route.meta.title
  }
  // 3. 最后返回默认值
  return ''
})

function Back() {
  router.back()
}

// 根据路由动态控制头部返回按钮
const showHeaderBack = computed(() => {
  // 不在白名单中的页面显示返回按钮
  const noBackPages = ['/home', '/msite', '/profile', '/']

  return props.showBack && !noBackPages.includes(route.path)
})

// 根据路由控制头部定位文字
const showHeaderLocation = computed(() => {
  // 只在特定页面显示定位文字
  const locationPages = ['/msite']
  return locationPages.includes(route.path)
})
</script>

<template>
  <header id="head_top" :class="`head-top--${theme}`">
    <div class="left_area">
      <slot name="logo" />
        <!-- 返回标签 -->
        <span v-if="showHeaderBack" class="head_goback" @click="Back">
          <SvgIcon icon-name="arrow-left" icon-class="svg" />
        </span>

        <slot name="title" />
        <!-- 文字标题 -->
        <span class="title_text">
          {{ Title }}
        </span>
      <!-- 定位 -->
       <template v-if="showHeaderLocation">
        <SvgIcon icon-name="location" icon-class="svg" />
        <span class="location_text">
          {{ locationText }}
        </span>
       </template>
</div>

    <div class="right_area">
      <slot name="changecity" />
      <slot name="edit" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
#head_top {
  @include wh(100%, 12vw);

  position: relative;
  z-index: 999;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: $blue;

  .left_area {
    display: flex;
    align-items: end;
    min-width: 60px;

    .svg {
      @include wh(5.6vw, 16px);

      fill: rgb(255 255 255);
    }

      .title_text {
        padding-right: 5px;
        font-size: 20px;
        font-weight: 600;
        color: #fff;
      }

      .location_text {
        padding-left: 3px;
        font-size: 16px;
        color: #fff;
      }
  }

  .right_area {
    min-width: 60px;
    margin-left: auto;
    text-align: right;
  }
}

// 返回标签
.head_goback {
  height: 100%;
  padding-right: 3px;
  vertical-align: top;
}
</style>
