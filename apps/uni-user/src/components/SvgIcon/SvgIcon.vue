<script setup lang="ts">
/**
 * 图标组件 —— 与 web-user 的 components/SvgIcon/index.vue **调用方 API 完全一致**
 * （`icon-name` / `icon-class` / `color` / `multicolor` 四个 prop），内部实现全换。
 *
 * ⚠️ 为什么换实现：小程序端**不支持 `<svg>` 标签，也不支持 sprite**
 * （web-user 用 `<svg><use href="#icon-xxx"/></svg>` + vite-plugin-svg-icons）。
 * 改用 iconfont 字体图标（迁移方案 H 节）：
 * - 单色模式：`<text class="icon icon-xxx">`，颜色走 CSS `color` 继承
 *   （对齐 web-user 的 `fill: var(--icon-fill, currentColor)` 语义）
 * - 多色模式：字体丢色，走 PNG 兜底（`src/static/icons-png/`）
 *
 * 字体来源：scripts/generate-iconfont.mjs 从 web-user 的 38 个单色 svg 生成，
 * ttf 已 base64 内联进 elm-iconfont.css（小程序 @font-face 不支持本地路径）。
 *
 * ⚠️ 调用方样式契约（mp-weixin 硬约束，写错不报错、只静默失效）：
 * - **尺寸**：`<SvgIcon class="xxx">` 标签级 class 写 `font-size`。两个分支都是
 *   1em（字体分支 `.icon`、PNG 分支 `.svg-icon-png`），字号即图标边长。
 *   标签级 class 落在**宿主节点**上，宿主节点属于调用方自己的渲染树、带调用方的
 *   scope id，所以调用方 scoped 规则能命中；`font-size` 再继承进组件内部节点。
 * - **颜色**：用 `color` prop（编译成内部节点 inline style，必定生效）。
 * - **`icon-class` 禁止用来传样式**：它落在组件内部 `<text>`/`<image>` 上。
 *   调用方 scoped 规则编译后形如 `.a .b.data-v-xxx`，而内部节点**没有** `data-v-xxx`
 *   （编译产物里只有宿主标签有），加上自定义组件默认样式隔离 → 规则永远匹配不上。
 *   保留此 prop 仅为与 web-user 调用方 API 对齐，只可当语义标记用。
 * - 另注：字体图标的字形是正方形栅格，**width/height 不改变字形大小**（那是 web-user
 *   `<svg>` 的语义）。web-user 里 `width:10px;height:16px` 这类瘦长比例无法在字体
 *   分支等价复现，只能按高度取 font-size，宽高比差异需真机目视验收。
 */
import { computed } from 'vue'

const props = defineProps({
  iconName: {
    type: String,
    required: true,
  },
  iconClass: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
  /**
   * 字体图标的字号（尺寸）。⚠️ 不能靠调用方的 class 传 font-size —— 它落在宿主
   * 节点上，而 scoped 样式 + 组件样式隔离（isolated）会拦住，进不到内部 <text>。
   * 尺寸/颜色这类要作用在内部节点的样式，必须走 prop（编译成内部 inline style）。
   * 任意合法 CSS 字号（'40rpx' / '20px' / '1.2em' 均可）。
   */
  size: {
    type: String,
    default: '',
  },
  multicolor: {
    type: Boolean,
    default: false,
  },
})

/** 单色：字体类名。与 web-user 的 `#icon-${name}` 对应 `icon-${name}` */
const fontClass = computed(() => {
  const base = `icon icon-${props.iconName}`
  return props.iconClass ? `${base} ${props.iconClass}` : base
})

/**
 * ⚠️ 多色图标清单 —— 与 scripts/generate-iconfont.mjs 的 EXCLUDE、
 * scripts/generate-multicolor-png.mjs 的 MULTICOLOR **三处必须同步**。
 *
 * 为什么按「图标本身是否多色」判断，而不是按 multicolor prop：
 * 实测 web-user 里 multicolor prop **零调用方**，唯一的多色图标 fengniao
 * 是以单色模式调用的（views/food/components/FilterPanel.vue:77）。
 * 但它在 web-user 实际渲染成多色 —— svg 内部 path 自带的 fill 优先级高于
 * 外层 `.svg-icon { fill: currentColor }`，不会被覆盖。
 * → 小程序端若按 prop 判断，fengniao 会走字体而丢色，与 H5 观感不符。
 * 所以这里对多色图标**无条件**走 PNG 兜底。
 *
 * ⚠️ backtop 是特例：它的 svg 由两条独立子路径组成（上箭头 + 顶部长横线），
 * svgtofont 对这种复合路径的 advance width 计算异常 → 字形宽度被压扁
 * （实测渲染宽高比 6.75:27，严重失调）。字体分支不可用，走 PNG 兜底。
 */
const MULTICOLOR_ICONS = new Set(['fengniao', 'cart-icon', 'sdk_icon_zhifubao', 'backtop'])

const usePng = computed(() => props.multicolor || MULTICOLOR_ICONS.has(props.iconName))

/** 多色：PNG 兜底路径。⚠️ 只有多色图标需要，其余走字体 */
const pngSrc = computed(() => `/static/icons-png/${props.iconName}.png`)

/**
 * 单色模式的文字样式：颜色 + 字号都走内部 inline style（必定生效，不受样式隔离影响）。
 * ⚠️ web-user 用 CSS 变量 `--icon-fill` 覆盖 fill；小程序端字体图标直接继承
 * `color`，所以把 color prop 映射到 style.color 即可，语义等价。
 * size 同理：字体图标的尺寸由 font-size 决定，inline 到内部 <text>。
 */
const textStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.color)
    style.color = props.color
  if (props.size)
    style.fontSize = props.size
  return Object.keys(style).length > 0 ? style : undefined
})

/**
 * PNG 分支的尺寸样式：PNG 是图片不是字体，font-size 控制不了它，
 * 必须把 size 映射成 image 的 width/height（inline，绕开样式隔离）。
 */
const pngStyle = computed(() => {
  if (!props.size)
    return undefined
  return {
    width: props.size,
    height: props.size,
  }
})
</script>

<template>
  <!-- 多色：PNG 兜底（保留原色）。尺寸默认 1em 对齐字体模式；传 size 则按 size -->
  <image
    v-if="usePng"
    class="svg-icon-png"
    :class="iconClass"
    :src="pngSrc"
    :style="pngStyle"
    mode="aspectFit"
  />
  <!-- 单色：字体图标 -->
  <text
    v-else
    :class="fontClass"
    :style="textStyle"
  />
</template>

<style lang="scss">
/* ⚠️ 不 scoped：iconfont 的类定义在外部 css（base64 @font-face + 38 个图标类），
   scoped 会给类名加 hash 导致字体类失效。字体 css 在 App.vue 里全局引入。 */

/* 字体图标基线：对齐 web-user 的 .svg-icon（1em × 1em） */
.icon {
  display: inline-block;
  line-height: 1;
}

.svg-icon-png {
  width: 1em;
  height: 1em;
}
</style>
