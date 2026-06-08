<script setup>
// import { usePageTitle } from '@/composables/usePageTitle';

import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { useUserStore } from '@/stores/modules/store-user'

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

const { userId } = storeToRefs(useUserStore())
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

function handleSearch() {
  router.push('/search')
}

// 根据路由动态控制头部返回按钮
const showHeaderBack = computed(() => {
  // 不在白名单中的页面显示返回按钮
  const noBackPages = ['/home', '/msite', '/profile', '/']

  return props.showBack && !noBackPages.includes(route.path)
})

// 根据路由控制头部搜索图标
const showHeaderSearch = computed(() => {
  // 只在特定页面显示搜索图标
  const searchPages = ['/msite']
  return searchPages.includes(route.path)
})
</script>

<template>
  <header id="head_top" :class="`head-top--${theme}`">
    <!-- <div class="warp"> -->
    <div class="left_area">
      <slot name="logo" />
      <!-- 返回标签 -->
      <section v-if="showHeaderBack" class="head_goback" @click="Back">
        <SvgIcon icon-name="arrow-left" icon-class="svg" />
      </section>
      <!-- 搜索图标 -->
      <SvgIcon v-if="showHeaderSearch" icon-name="search" icon-class="svg" @click="handleSearch" />
    </div>
    <div class="center_area">
      <slot name="title" />
      <!-- 文字标题 -->
      <section v-show="Title" class="head_title">
        <span class="title_text">{{ Title }}</span>
      </section>
    </div>

    <div class="right_area">
      <!-- 用户登录状态图标 -->
      <router-link v-if="singUp" :to="userId ? '/profile' : '/login'" class="or_login">
        <SvgIcon v-if="userId" icon-name="user" icon-class="user_avatar" />
        <span v-else class="login_span"> 登录|注册 </span>
      </router-link>
      <slot name="changecity" />
      <slot name="edit" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
// .header-placeholder {
//   height: 12vw;
//   // background: $blue;
// }
.page-wrapper {
  flex: 1;

  /* 确保内容区至少占满屏幕，防止 mode="out-in" 时高度塌陷 */

  /* min-height: calc(100vh - 45px); */
}

#head_top {
  @include wh(100%, 12vw);

  position: relative;
  z-index: 999;

  // inset: 0;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: $blue;

  .left_area {
    min-width: 60px;

    .svg {
      @include wh(5.6vw, 20px);

      vertical-align: bottom;
      fill: rgb(255 255 255);
    }
  }

  .center_area {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .right_area {
    min-width: 60px;
    margin-left: auto;
    text-align: right;

  }
}

.head-top--light {
  background-color: #fff !important;

  .left_area {
    .svg {
      fill: #222 !important;
    }
  }

  .head_title {
    .title_text {
      font-weight: 500;
      color: #222;
    }
  }

  .right_area {
    color: #222;
  }
}

// }

//  返回标签
.head_goback {
  height: 100%;

}

// 中间标题内容
.head_title {
  .title_text {
    font-size: 5vw;
    font-weight: bold;
    color: $ff;
  }
}

// 登录状态
.or_login {
  .user_avatar {
    // transform: translateX(200%);
    @include wh(5.3333vw, 5.3333vw);

    fill: #fff;
  }

  .login_span {
    @include size-color(4.0627vw, #fff);
  }
}
</style>
