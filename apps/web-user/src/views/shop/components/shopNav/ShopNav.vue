<script setup>
import { computed, onUnmounted, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'

// ==================== Props ====================
/**
 * 商家顶栏：返回、搜索；背景/搜索条随滚动渐变。
 * scrollElement 传入时用其 scrollTop（如 .shop-scroll），否则 window。
 */
const props = defineProps({
  /**
   * 自定义滚动源（如商家页 `.shop-scroll` 的 ref）。
   * 不传时沿用 `window` 滚动，保持其它使用场景不变。
   */
  scrollElement: {
    type: [Object, HTMLElement],
    default: null,
  },
})

// ==================== 路由 ====================
const router = useRouter()

// ==================== 常量 ====================
/** 背景完全显示所需的滚动距离（px） */
const THRESHOLD = 280

// ==================== 数据状态 ====================
/** 当前滚动位置 */
const scrollY = ref(0)

// ==================== 计算属性 ====================
/** 滚动进度：0 ~ 1，用于驱动所有渐变效果 */
const scrollPercent = computed(() => Math.min(scrollY.value / THRESHOLD, 1))

/** 导航栏动态样式：背景透明度、文字颜色、搜索框伸缩、搜索框背景 */
const navDynamicStyle = computed(() => {
  const colorRGB = Math.floor(255 - 255 * scrollPercent.value)
  const colorStr = `rgb(${colorRGB}, ${colorRGB}, ${colorRGB})`

  return {
    '--nav-bg-opacity': scrollPercent.value,
    '--content-color': colorStr,
    '--search-flex-grow': scrollPercent.value,
    '--search-bg': `rgba(240, 240, 240, ${scrollPercent.value})`,
  }
})

// ==================== 方法 ====================
/** 获取实际滚动源 DOM（支持 ref 包装或原生 HTMLElement） */
function getScrollSourceEl() {
  const raw = unref(props.scrollElement)
  if (raw && raw.nodeType === 1)
    return raw
  return null
}

/** 读取当前滚动位置：优先自定义元素，回退 window */
function readScrollTop() {
  const root = getScrollSourceEl()
  return root ? root.scrollTop : window.scrollY
}

/** 滚动回调：同步 scrollY 状态 */
function handleScroll() {
  scrollY.value = readScrollTop()
}

/** 解绑当前滚动监听（初始为空函数，避免 onUnmounted 时空调用报错） */
let detachScroll = () => { }

/**
 * 绑定滚动监听
 * 切换 scrollElement 时自动解绑旧目标、绑定新目标
 */
function bindScroll() {
  detachScroll()
  const root = getScrollSourceEl()
  const target = root ?? window
  target.addEventListener('scroll', handleScroll, { passive: true })
  detachScroll = () => target.removeEventListener('scroll', handleScroll)
  handleScroll() // 立即执行一次，初始化样式
}

/** 返回上一页 */
function goBack() {
  router.back()
}

/** 跳转搜索页 */
function goSearch() {
  router.push('/search')
}

// ==================== 监听器 ====================
/**
 * 监听 scrollElement 变化
 * flush: 'post' 确保 DOM 已挂载后再绑定，避免监听失效
 * immediate: true 初始化时立即执行
 */
watch(
  () => unref(props.scrollElement),
  () => bindScroll(),
  {
    flush: 'post',
    immediate: true,
  },
)

// ==================== 生命周期 ====================
onUnmounted(() => {
  detachScroll()
})
</script>

<template>
  <nav class="shop-nav" :style="navDynamicStyle">
    <div class="nav-back" @click="goBack">
      <SvgIcon icon-name="back" icon-class="iconfont" />
    </div>

    <div class="nav-search-wrapper">
      <div class="search-bar" @click="goSearch">
        <div class="search-icon-box">
          <SvgIcon icon-name="search" icon-class="iconfont nav-search" />
        </div>

        <Transition name="fade">
          <span v-show="scrollPercent > 0.5" class="line" />
        </Transition>

        <Transition name="fade">
          <div v-show="scrollPercent > 0.5" class="search-content">
            <span class="placeholder">搜索商品...</span>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.shop-nav {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  padding: 0 12px;

  // background: $ff;
  background-color: rgb(255 255 255 / var(--nav-bg-opacity));

  .iconfont {
    font-size: 19px;
    color: black;
    transition: color 0.1s linear;
  }
}

.nav-search-wrapper {
  display: flex;
  flex: 1;
  justify-content: flex-end;
}

.search-bar {
  display: flex;
  flex-grow: var(--search-flex-grow, 0);

  /* 动态增长 */
  flex-basis: 34px;
  flex-direction: row-reverse;
  align-items: center;

  /* 初始仅图标宽度 */
  max-width: 150px;

  /* 上限 */
  height: 34px;
  overflow: hidden;
  background: var(--search-bg);
  border-radius: 17px;
  transition: flex-grow 0.2s ease-out;

  /* 平滑过渡 */

  .search-icon-box {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
  }

  .search-content {
    display: flex;
    flex: 1;
    align-items: center;

    /* 占据剩余空间 */
    overflow: hidden;
    white-space: nowrap;

    .placeholder {
      padding-left: 15px;
      font-size: 13px;
      color: #999;
    }
  }

  .line {
    flex-shrink: 0;
    width: 1px;
    height: 16px;
    background: #999;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.9s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
