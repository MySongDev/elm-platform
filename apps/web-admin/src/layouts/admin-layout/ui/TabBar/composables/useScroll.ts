import type { Ref } from 'vue'
import { nextTick, ref } from 'vue'

/**
 * 滚动边界容差（px）。
 * WHY: 贴边判定留 1px 余量，避免 scrollLeft 恰好等于 maxScrollLeft 时，
 *   canScrollRight 因严格小于号差 1px 而在同一次滚动里被反复切换。
 */
const SCROLL_EDGE_GAP = 1

/** 点击左右箭头时的最小滚动距离（px） */
const MIN_SCROLL_DISTANCE = 220

/** 单次滚动距离 = max(最小值, 容器可视宽度 × 该比例) */
const SCROLL_DISTANCE_RATIO = 0.6

/**
 * TabBar 横向滚动能力（方案 A：DOM 所有权在视图层）。
 *
 * 意图：管理 TabBar 的横向滚动——溢出检测、左右箭头、滚轮、激活 tab 自动滚入可视区。
 *
 * WHY DOM ref 由调用方传入、而不是这里创建 template ref：
 *   本文件管行为与监听生命周期，不管模板长什么样。
 *   ref 绑在视图层，本模块就不会被模板结构绑死，同一套逻辑可复用到结构不同的 TabBar。
 *
 * 输入输出：
 *   入：scrollContainerRef（可滚动容器）、tabTrackRef（track，用于 ResizeObserver 监听内容宽度变化）。
 *   出：状态(canScrollLeft/Right/isOverflow) + 行为(scroll/handleWheel/scrollActiveIntoView/setup/cleanup)。
 *
 * 生命周期：setupScrollListeners 与 cleanupScrollListeners 必须配对调用，否则监听泄漏。
 */
export function useScrollManager(
  scrollContainerRef: Ref<HTMLElement | null | undefined>,
  tabTrackRef: Ref<HTMLElement | null | undefined>,
) {
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const isOverflow = ref(false)

  // WHY 存变量而非局部 const：cleanup 时需要 disconnect。
  // WHAT IF: 改成局部创建 → 组件卸载后 observer 仍在 observe 已失效的 DOM。
  let resizeObserver: ResizeObserver | undefined

  /**
   * 读 DOM 当前状态，同步 isOverflow / canScrollLeft / canScrollRight 三个 ref。
   *
   * 调用方：scroll 事件、window resize、ResizeObserver、scrollActiveIntoView 滚完之后。
   * WHY 在滚完之后还要再调一次：scrollLeft 是 smooth 过渡中的，滚动进行中读到的值是中间态，
   *   不刷新会让箭头状态与实际位置脱节。
   *
   * WHAT IF: 删掉 → 箭头状态永远停在初始值；或首帧 scrollWidth 为 0 被判成"不溢出"，箭头不出现。
   */
  function updateScrollState() {
    const el = scrollContainerRef.value
    if (!el)
      return
    const maxScrollLeft = getMaxScrollLeft(el)
    isOverflow.value = maxScrollLeft > SCROLL_EDGE_GAP
    canScrollLeft.value = el.scrollLeft > SCROLL_EDGE_GAP
    canScrollRight.value = el.scrollLeft < maxScrollLeft - SCROLL_EDGE_GAP
  }

  function getMaxScrollLeft(el: HTMLElement) {
    return Math.max(0, el.scrollWidth - el.clientWidth)
  }

  /**
   * 把 child 滚进 container 的可视区，只改横向 scrollLeft。
   *
   * WHY 不用 el.scrollIntoView()：它会连带滚动所有可滚祖先容器，
   *   在布局里会把整个页面带着纵向滚一段。
   *
   * 左右溢出互斥（child 只有一个位置），所以一次算清 scrollLeft，不需要分两步试。
   *
   * @throws {Error} never —— 参数由调用方保证是同一个滚动容器内的子元素
   */
  function scrollChildIntoContainer(container: HTMLElement, child: HTMLElement) {
    const containerRect = container.getBoundingClientRect()
    const childRect = child.getBoundingClientRect()

    // 负值=左侧被挡在容器外，正值=右侧溢出
    const overflowLeft = childRect.left - containerRect.left
    const overflowRight = childRect.right - containerRect.right

    let nextLeft = container.scrollLeft
    if (overflowLeft < -SCROLL_EDGE_GAP)
      nextLeft += overflowLeft
    else if (overflowRight > SCROLL_EDGE_GAP)
      nextLeft += overflowRight
    else
      // 已经完整可见：什么都不做。强制滚动会把用户的浏览位置拽走。
      return

    // WHY 先夹紧再判差值：left/right 两侧贴着边时算出的 nextLeft 可能越界，
    //   直接 scrollTo 会被浏览器忽略，白跑一次 smooth 动画。
    const maxScrollLeft = getMaxScrollLeft(container)
    nextLeft = Math.max(0, Math.min(nextLeft, maxScrollLeft))

    if (Math.abs(nextLeft - container.scrollLeft) <= SCROLL_EDGE_GAP)
      return

    container.scrollTo({
      left: nextLeft,
      behavior: 'smooth',
    })
  }

  /**
   * 点击左右箭头时翻一页，步长 = max(220, 容器宽度 × 0.6)。
   *
   * WHY 取两者的 max 而不是单一策略：纯固定步长在大屏上一次只挪一点（点几次才看完），
   *   纯比例在小屏上又可能挪得过短（看不出响应）。
   *
   * 为什么是 smooth 而非 auto：箭头是"翻页"而非"对齐"语义，
   *   平滑过渡让连续点击有累积感；scrollChildIntoContainer 用 smooth 是为了
   *   对齐目标位置，handleWheel 用 auto 是因为滚轮本身已带物理惯性、
   *   再叠 smooth 会双重加减速导致卡顿。三者语义不同，行为参数不能统一。
   */
  function scroll(direction: 'left' | 'right') {
    const el = scrollContainerRef.value
    if (!el)
      return
    const distance = Math.max(MIN_SCROLL_DISTANCE, Math.floor(el.clientWidth * SCROLL_DISTANCE_RATIO))
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    })
  }

  /**
   * 把滚轮手势转成 TabBar 的横向滚动。
   *
   * WHAT IF 删掉 isOverflow 判断 → 内容没溢出时，鼠标停在 TabBar 上滚轮，
   *   会连页面正文一起锁死不能滚，是很常见的"页面卡住了"投诉来源。
   */
  function handleWheel(e: WheelEvent) {
    const el = scrollContainerRef.value
    if (!el || !isOverflow.value)
      return

    e.preventDefault()
    // 触控板横滑给 deltaX，鼠标滚轮给 deltaY，取绝对值大的那个当作滚动方向
    const offset = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    el.scrollBy({
      left: offset,
      behavior: 'auto',
    })
  }

  /**
   * 把当前激活的 tab 滚进可视区。
   *
   * WHY 必须 nextTick（已验证，非猜测）：
   *   调用链是 tabSyncGuard（router.afterEach）→ addTab → 组件 re-render（class 同步
   *   打到 DOM）→ index.vue 的 watch(route.fullPath) → 本函数。watch 默认 flush:
   *   'pre'，在 DOM 更新前执行；nextTick 把查询推迟到更新完成后，此时
   *   TabBarItem 的 :class="{ 'is-active': active }" 已写入 DOM（Vue 的 class patch
   *   是同步的，runtime-dom patchProp 不经过微任务）。同步执行时查不到，静默返回。
   *
   *   对比 useMenu.openContextMenu：那里 Teleport 需要 nextTick 才把菜单渲染进 DOM，
   *   所以尺寸测量要延后；这里没有 Teleport，只有 class 时序，延后动机不同，不能直接套用。
   *
   * WHY 不做竞态令牌（对比 useMenu 的 dismissSessionToken）：
   *   同一时刻最多只有一个 .is-active，快速连点多个 tab 时后一次 nextTick
   *   是在前一次已渲染的 DOM 上再算一次，结果仍收敛到最后那个 tab。
   */
  function scrollActiveIntoView(selector = '.tab-item.is-active') {
    nextTick(() => {
      const container = scrollContainerRef.value
      const activeEl = container?.querySelector(selector)
      if (!container || !(activeEl instanceof HTMLElement))
        return

      scrollChildIntoContainer(container, activeEl)
      updateScrollState()
    })
  }

  /**
   * 挂载滚动相关的外部监听。由视图层 onMounted 调用。
   *
   * WHY 三条监听各自不可省：滚动与 resize 只在窗口尺寸变时触发，
   *   而「tab 增删导致 track 变宽」既不产生 scroll 也不产生 resize——只有 ResizeObserver 能捕捉。
   *
   * WHY ResizeObserver 同时监听 container 与 track：
   *   窗口 resize 时 container 变宽、track 不变（track 是 min-width:100% 的撑满
   *   布局，只随 container 收缩到不更小）；tab 增删时 track 内容宽度变、container 不变。
   *   只监听 track 会漏掉"窗口缩放"场景（container 变了它没变），
   *   只监听 container 会漏掉"tab 增删"场景（track 变了它没变）。
   *
   * WHY 末尾 nextTick(updateScrollState)：上面三条都是「事件发生时才跑」，
   *   首次渲染的宽度测量必须主动补一次，否则挂载瞬间箭头状态是初始的 false。
   *
   * @throws {Error} never —— 幂等性由调用方保证（onMounted 只跑一次），重复调用会重复挂监听
   */
  function setupScrollListeners() {
    // DOM 关联在调用方完成（useTemplateRef + 模板 ref）；这里只挂监听。
    scrollContainerRef.value?.addEventListener('scroll', updateScrollState, {
      passive: true,
    })
    window.addEventListener('resize', updateScrollState)

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => updateScrollState())
      if (scrollContainerRef.value)
        resizeObserver.observe(scrollContainerRef.value)
      if (tabTrackRef.value)
        resizeObserver.observe(tabTrackRef.value)
    }

    nextTick(updateScrollState)
  }

  /**
   * 解除全部监听。由视图层 onUnmounted 调用，必须与 setupScrollListeners 配对。
   *
   * WHAT IF 不调 → window / DOM 上留着指向已销毁组件的监听器，
   *   之后每次滚动都会执行 updateScrollState 并写三个已无人观察的 ref。
   */
  function cleanupScrollListeners() {
    scrollContainerRef.value?.removeEventListener('scroll', updateScrollState)
    window.removeEventListener('resize', updateScrollState)
    resizeObserver?.disconnect()
    resizeObserver = undefined
  }

  return {
    canScrollLeft,
    canScrollRight,
    isOverflow,
    scroll,
    handleWheel,
    updateScrollState,
    scrollActiveIntoView,
    setupScrollListeners,
    cleanupScrollListeners,
  }
}
