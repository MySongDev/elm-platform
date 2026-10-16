/**
 * px / vw → rpx 单位换算 codemod —— ⚠️ 一次性脚本，跑完即弃
 *
 * 【归属】apps/uni-user（uni-app 微信小程序端）
 *   迁移方案议题 4「CSS 单位换算基准」/ Batch 1 第 9 项。
 *   放在包内而非仓库根 scripts/：它只服务于「web-user → uni-user 样式搬运」这一次迁移。
 *
 * 【为什么是一次性的】
 *   web-user（H5、375 设计稿、px/vw）与 uni-user（小程序、rpx）的样式是**分叉资产**
 *   （议题 7：样式端相关，不进任何共享包）。转换做完两边就永久各自维护，
 *   这个脚本不再有输入 → **不进 CI、不长期维护、不写测试**。跑完即弃。
 *
 * 【换算系数】（议题 4：设计稿基准 375，三条证据互相印证）
 *   px × 2   → rpx   （1px = 2rpx）
 *   vw × 7.5 → rpx   （1vw = 375 / 100 = 3.75px，再 × 2）
 *   vh / dvh / svh **保留不转**（垂直方向 rpx 无法表达；小程序端 vh 支持良好）
 *   数值统一四舍五入到最多 2 位小数并去掉末尾 0，最大误差 0.005rpx，肉眼不可见。
 *
 * 【处理范围（安全集）】
 *   ✅ .vue 文件的 <style>…</style> 块内部（多个块都处理）
 *   ✅ 独立 .scss 文件
 *   ❌ .css 文件 —— 见下方 Q2
 *   ❌ <script> / <template> 全文（含模板内联 style、模板属性）
 *
 * 【9 类排除规则】前 8 类来自议题 4「★ codemod 的 8 类边界」，第 9 类是实测补充
 *
 *   ① ≤1px 的**发丝值**按属性名区分（不是按值一刀切）：
 *        转   —— padding* / margin* / border-radius*
 *        不转 —— border*（radius 除外）/ letter-spacing / transform / box-shadow
 *                / vertical-align / width / height
 *        属性不在两名单内 → 转（安全集默认）
 *        值 > 1px → 无条件转（与属性无关）
 *      ⚠️ 判定顺序是「先解析出属性名，再逐个 token 决定」，
 *         所以 `padding: 1px 4px` 里那个该转的 1px 不会被漏掉。
 *
 *   ② CSS 自定义属性 / SCSS 变量定义行（`--nav-height: 50px`、`$x: 10px`）
 *      → 跳过并**输出警告清单**，绝不静默跳过。
 *      原因：这些值常被 JS 侧硬编码镜像 —— web-user `composables/ui/useMenuScroll.ts:31`
 *      的 `const stickyHeight = 92` 就是 `--nav-height(50) + --tab-height(42)`。
 *      只改 CSS 会让吸顶偏移直接错位（议题 3 × 议题 4 交叉点，Batch 0.5 PoC 第 ③ 项）。
 *
 *   ③ 模板属性里的 px（`<SkeletonBlock width="32px">`，28 处）
 *      → 天然不处理（脚本只看 <style> 块）。归手工：连同 `SkeletonBlock.vue:21`
 *      的 `normalizeSize` 一起改，否则骨架屏与真实内容尺寸不匹配会跳动。
 *
 *   ④ @media 块（**含条件行本身**，如 `@media (width <= 374px) {`）
 *      → 花括号配对整块跳过，并按 file:line 输出待评估清单（Q6）。
 *      media query 断点是视口物理像素，rpx 在其中语义不同且部分端不支持；
 *      且这些 H5 断点在小程序端可能永不触发或永远触发，需真机复评。
 *
 *   ⑤ calc() 内的 px → **转**（`env(safe-area-inset-*)` 返回 px，calc 支持混合单位），
 *      其中的 vh 因不在匹配集内天然保留：`calc(100vh - 150px)` → `calc(100vh - 300rpx)`。
 *      含 calc 的改动行单独列出，供真机验证小程序端是否支持混合单位。
 *
 *   ⑥ <script> 内与模板内联 style 的 px → 天然不处理（只看 <style> 块）。
 *      那些值来自 `getBoundingClientRect()`，是**运行时设备像素**而非设计稿尺寸，
 *      转了飞入动画位置就错。小程序端 `boundingClientRect()` 返回的也是 px，JS 侧要全程用 px。
 *
 *   ⑦ `rootMargin` 里的 px（4 处）→ 天然不处理（在 .ts/.js 里，且宿主文件本来就要重写：
 *      小程序端无 IntersectionObserver）。
 *
 *   ⑧ `@include` 整行 → 跳过并输出手工清单（16 处：带 px 9 + 带 vw 7）。
 *      mixin 调用里**没有属性名**，① 的白名单规则无从匹配 ——
 *      `@include wh(100%, 1px)` 的 1px 语义是 height，但源码里没有 `height:` 字样。
 *      改法是按 mixin 语义还原成属性再判断。
 *      ⚠️ 只改 uni-user 侧的调用处，**不改 mixin 定义**（改定义会波及 web-user，违背议题 9 决策 A）。
 *
 *   ⑨（实测补充）注释内的 px → 跳过并计数。
 *      `//` 行注释、块注释、以及字符串字面量内一律不转。
 *      这既避免污染死代码 diff（web-user `addressHome.vue:74-75` 有整段注释掉的样式），
 *      也是**幂等性的前提**：`uni-user/src/pages/index/index.vue:288` 的说明文字
 *      「1px = 2rpx」若被转成「2rpx = 2rpx」，幂等验证就会假阳性失败。
 *
 * 【规格补充裁定（2026-09-28 协调者确认，本文件即规格载体）】
 *   Q1 小数 px（`.4px` / `.5px`）：白名单判定对象从「值恰为 1px」推广为「值 ≤ 1px 的发丝类」。
 *      理由：① 类的意图是「发丝细线 / 字距微调在 rpx 下会变粗」，`.4px` 在 letter-spacing
 *      上与 `1px` 是同一意图（web-user 实测 `SmsVerification.vue:283` letter-spacing: .4px、
 *      `SearchHome.vue:162` border: .5px）。对议题 4 实测的 55 处（全是恰 1px）行为完全不变，零回归。
 *      ⚠️ 不采用「属性受限就跳过整行所有 px」—— 那会在 v > 1 时误伤 `width: 200px` 这类布局尺寸。
 *   Q2 `.css` 文件不处理。依据：`nprogress.css` 随 NProgress 一并作废（方案 ⑦ 节），
 *      `reset.css` 实测 0 处 px。将来若 reset.css 迁入且带 px，单文件手工处理。
 *   Q3 注释跳过：见 ⑨，必须做。
 *   Q4 ②∩⑤ 交叉行（如 web-user `cart.vue:142`
 *      `--cart-bottom-safe: calc(168px + env(safe-area-inset-bottom))`）算 **1 处**手工项，
 *      但报告同时打 ② 和 ⑤ 两个标签，避免复核时重复计工或漏看。
 *   Q5 脚本归属 `apps/uni-user/scripts/` 已确认（迁移方案文档的同步由协调者处理）。
 *   Q6 ④ 清单带 file:line 输出，作为真机断点评估的待办清单。
 *   Q7（本脚本实现时新发现，按规格字面处理 + 标注，未自行改规格）：
 *      圆角长手写 `border-top-left-radius` / `-top-right` / `-bottom-left` / `-bottom-right`
 *      字面匹配不转名单的 `border*` 前缀，但语义上与可转的 `border-radius` 同属圆角。
 *      Q1 裁定把可转名单写作 `padding`、`margin*`、`border-radius`（此处拆开写，
 *      因为 `margin*` 紧跟斜杠会形成块注释结束符），未点名这四个长手写 →
 *      本脚本按**字面归「不转」**。实测 web-user + uni-user 此类写法配 ≤1px 为 **0 处**，
 *      本次迁移零影响。若协调者认为应归可转，改 isConvertibleProperty 即可（一处）。
 *      同类字面读法：不转名单写的是 `width`/`height`，故 `min-width`/`max-height` 等
 *      带前缀的变体**按字面归可转**。实测 web-user + uni-user 真实语料中，
 *      `min-*`/`max-*` 配 ≤1px 为 **0 处**（全仓只有 `addressHome.vue:95` 的
 *      `min-height: 91px`，v > 1 与本项无关）→ 零影响，同样未自行扩规格。
 *   另：单位匹配集只含 `px|vw`（dvh/svh 天然保留）；声明按行解析，
 *   「有 px 但解析不出属性名」的行**照转**（与安全集默认一致）+ 列入第三类清单兜住误转；
 *   写盘不做行尾归一化（web-user 与 uni-user 实测全为 LF，归一化会制造全文件 diff）。
 *
 * 【幂等性】单位匹配集只含 px|vw，而 `2rpx` 里的 `px` 前面是 `r` 不是数字 → 不会被二次匹配，
 *   `2rpx` 不会变成 `4rpx`。已转过的文件再跑一次应零改动。
 *
 * 【用法】
 *   node apps/uni-user/scripts/px-to-rpx.mjs                    # dry-run（默认），只报告不写盘
 *   node apps/uni-user/scripts/px-to-rpx.mjs --write            # 写盘
 *   node apps/uni-user/scripts/px-to-rpx.mjs <目录> --dry-run    # 指定目标目录
 *   默认目标：apps/uni-user/src
 *
 * 【跑完之后 ⚠️ 报告不等于验收】
 *   1. 必须逐页与 web-user（dev 5174）并排目视对比 —— 视觉还原没有自动化验证手段。
 *   2. ②③⑤⑧ 四类约 60 处手工项按报告清单逐个处理，② 类必须与 JS 侧硬编码同步。
 *   3. ④ 类断点在真机上复评是否还有意义。
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// ── 换算常量 ────────────────────────────────────────────────────────────
/** 1px = 2rpx（375 设计稿基准） */
const PX_TO_RPX = 2
/** 1vw = 3.75px，再 × 2 = 7.5rpx */
const VW_TO_RPX = 7.5
/** ≤ 此值的 px 视为「发丝值」，需按属性名白名单判定（裁定 Q1） */
const HAIRLINE_MAX = 1
/** 输出保留的最大小数位 */
const MAX_DECIMALS = 2

// ── 正则 ────────────────────────────────────────────────────────────────
/**
 * 单位 token。交替写法 `(\d+(?:\.\d+)?|\.\d+)` 是刻意的：
 * 既覆盖 `.4px` 这种省略前导零的写法，又避免 `\d*\.?\d+` 触发
 * ESLint `regexp/no-super-linear-backtracking`（`\d*` 与 `\d+` 可交换字符）。
 * ⚠️ 匹配集**只含 px|vw** —— vh/dvh/svh 不在集内，天然保留；
 *    rpx 的 `px` 前是字母 `r`，前面没有数字，天然不会被二次匹配（幂等）。
 */
const UNIT_RE = /(\d+(?:\.\d+)?|\.\d+)(px|vw)/g
/** <style> 块（属性顺序任意、可无属性、可有多个块） */
const STYLE_BLOCK_RE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi
const MEDIA_RE = /^\s*@media\b/
const INCLUDE_RE = /^\s*@include\b/
const VAR_DEF_RE = /^\s*(?:--[\w-]+|\$[\w-]+)\s*:/
const PROPERTY_RE = /^\s*(-?[a-z][\w-]*)\s*:/i
const CALC_RE = /\bcalc\(/
const TARGET_EXT_RE = /\.(?:vue|scss)$/
const SKIP_DIRS = new Set(['node_modules', 'dist', 'unpackage', 'coverage', '.git', '.turbo'])

// ── CLI ─────────────────────────────────────────────────────────────────
const DEFAULT_TARGET = fileURLToPath(new URL('../src', import.meta.url))

function parseArgs(argv) {
  const args = argv.slice(2)
  let write = false
  let target = null
  for (const arg of args) {
    if (arg === '--write') {
      write = true
    }
    else if (arg === '--dry-run') {
      write = false
    }
    else if (arg === '--help' || arg === '-h') {
      return { help: true }
    }
    else if (arg.startsWith('-')) {
      console.error(`未知参数: ${arg}`)
      return { error: true }
    }
    else {
      target = arg
    }
  }
  return {
    write,
    target,
  }
}

// ── 属性白名单（① 类）────────────────────────────────────────────────────
/** 可转：布局间距与圆角，发丝值转成 2rpx 视觉无损 */
function isConvertibleProperty(name) {
  const n = name.toLowerCase()
  return n === 'padding'
    || n.startsWith('padding-')
    || n === 'margin'
    || n.startsWith('margin-')
    // 按裁定 Q1 的字面名单：`border-radius`（及其 `border-radius-*` 旧式前缀写法）可转。
    // ⚠️ 四个长手写 `border-top-left-radius` 等**不在此列** —— 它们字面匹配 `border*`
    //    前缀，按规格归「不转」。实测 web-user + uni-user 此类写法配 ≤1px 为 0 处，
    //    故本次迁移零影响；该归类是否应改为可转，见文件头 Q7（待协调者确认，勿自行改动）。
    || n === 'border-radius'
    || n.startsWith('border-radius-')
}

/**
 * 不转：细线分隔 / 字距 / 位移 / 细线阴影 / 基线微调 / 物理 1px 尺寸。
 * `2rpx` 在高分屏偏粗，且 `width:1px;height:1px;opacity:0` 是无障碍隐藏技巧，
 * 转了会破坏 `:focus-visible` 方案。
 * ⚠️ border-radius 虽以 `border-` 开头，但属可转名单，必须先排除。
 */
function isHairlineRestrictedProperty(name) {
  const n = name.toLowerCase()
  if (isConvertibleProperty(n)) {
    return false
  }
  return n === 'border'
    || n.startsWith('border-')
    || n === 'letter-spacing'
    || n === 'transform'
    || n === 'box-shadow'
    || n === 'vertical-align'
    || n === 'width'
    || n === 'height'
}

// ── 工具 ────────────────────────────────────────────────────────────────
function countUnits(text) {
  const found = text.match(UNIT_RE)
  return found ? found.length : 0
}

/** 四舍五入到 MAX_DECIMALS 位并去掉末尾 0；源码省略前导零时输出也省略（`.4px` → `.8rpx`） */
function formatRpx(value, rawNumber) {
  const rounded = Math.round(value * 10 ** MAX_DECIMALS) / 10 ** MAX_DECIMALS
  const text = String(rounded)
  if (rawNumber.startsWith('.') && rounded > 0 && rounded < 1) {
    return text.slice(1)
  }
  return text
}

/**
 * 构造「代码字符掩码」：注释与字符串字面量内的字符标记为 false（⑨ 类）。
 * `state.inBlock` 跨行持久，用于跟踪多行块注释。
 * 引号状态不跨行（CSS 里没有跨行字符串）。
 * `//` 前一个字符是 `:` 时不视为注释（`url(https://…)` 防御）。
 */
function buildCodeMask(line, state) {
  const mask = Array.from({ length: line.length }).fill(true)
  let quote = null
  let i = 0
  while (i < line.length) {
    const ch = line[i]
    const next = line[i + 1]
    if (state.inBlock) {
      mask[i] = false
      if (ch === '*' && next === '/') {
        mask[i + 1] = false
        state.inBlock = false
        i += 2
        continue
      }
      i += 1
      continue
    }
    if (quote !== null) {
      mask[i] = false
      if (ch === '\\') {
        mask[i + 1] = false
        i += 2
        continue
      }
      if (ch === quote) {
        quote = null
      }
      i += 1
      continue
    }
    if (ch === '\'' || ch === '"') {
      mask[i] = false
      quote = ch
      i += 1
      continue
    }
    if (ch === '/' && next === '*') {
      mask[i] = false
      mask[i + 1] = false
      state.inBlock = true
      i += 2
      continue
    }
    if (ch === '/' && next === '/' && line[i - 1] !== ':') {
      mask.fill(false, i)
      break
    }
    i += 1
  }
  return mask
}

/** 把非代码字符替换成空格，保持下标与原行一致（便于结构判断） */
function maskToCode(line, mask) {
  let code = ''
  for (let i = 0; i < line.length; i++) {
    code += mask[i] ? line[i] : ' '
  }
  return code
}

/** 统计花括号净增量，用于 @media 配对（④ 类） */
function braceDelta(code) {
  let delta = 0
  for (const ch of code) {
    if (ch === '{') {
      delta += 1
    }
    else if (ch === '}') {
      delta -= 1
    }
  }
  return delta
}

/**
 * 把一行掩码后的代码按 `;` / `{` / `}` 切成声明段，逐段解析属性名。
 * ⚠️ 必须逐段而非整行只取一个属性名：单行规则
 *    `.a { padding: 1px 4px; width: 1px }` 若整行按第一个属性判定，
 *    `width: 1px` 会被当成 padding 而误转 → ① 类发丝白名单直接失效。
 */
function buildPropertySegments(code) {
  const segments = []
  let start = 0
  for (let i = 0; i <= code.length; i++) {
    const ch = code[i]
    if (i === code.length || ch === ';' || ch === '{' || ch === '}') {
      const matched = PROPERTY_RE.exec(code.slice(start, i))
      if (matched) {
        const name = matched[1]
        segments.push({
          from: start,
          to: i,
          name,
          restricted: isHairlineRestrictedProperty(name),
          known: true,
        })
      }
      start = i + 1
    }
  }
  return segments
}

/** 查某个 offset 落在哪个声明段；不在任何段内 → 属性名未知（安全集默认照转 + ⑩ 清单） */
function resolvePropertyAt(segments, offset) {
  for (const seg of segments) {
    if (offset >= seg.from && offset < seg.to) {
      return seg
    }
  }
  return {
    name: null,
    restricted: false,
    known: false,
  }
}

// ── 统计容器 ─────────────────────────────────────────────────────────────
function createStats(file) {
  return {
    file,
    pxConverted: 0,
    vwConverted: 0,
    hairlineSkipped: [], // ① 发丝值按属性名跳过
    varDefs: [], // ② 变量定义行（需人工同步 JS 镜像）
    media: [], // ④ @media 块（需真机复评断点）
    includes: [], // ⑧ @include 参数（需手工按 mixin 语义改）
    unknownProperty: [], // 有 px 但解析不出属性名 → 照转 + 兜底清单
    calcLines: [], // ⑤ 含 calc 的改动行（需真机验证混合单位）
    maskedTokens: 0, // ⑨ 注释/字符串内跳过
    skippedTotal: 0,
    convertedTotal: 0,
  }
}

// ── 单行转换 ─────────────────────────────────────────────────────────────
/**
 * 逐个单位 token 处理：按 token 的 offset 查它落在哪个声明段，
 * 因此同一行内不同属性各按自己的白名单判定（见 buildPropertySegments 的 ⚠️）。
 */
function transformLine(line, mask, segments, lineNo, stats) {
  let converted = 0
  let unknown = false
  const result = line.replace(UNIT_RE, (match, num, unit, offset) => {
    // ⑨ 注释与字符串内：原样保留
    if (!mask[offset]) {
      return match
    }
    // vw → rpx（×7.5），与属性无关
    if (unit === 'vw') {
      stats.vwConverted += 1
      converted += 1
      return `${formatRpx(Number(num) * VW_TO_RPX, num)}rpx`
    }
    const info = resolvePropertyAt(segments, offset)
    if (!info.known) {
      unknown = true
    }
    // ① 发丝值（≤1px）且属性在不转名单 → 保留 px
    const value = Number(num)
    if (value <= HAIRLINE_MAX && info.restricted) {
      stats.hairlineSkipped.push({
        line: lineNo,
        property: info.name,
        token: match,
      })
      // ① 类跳过也计入 skippedTotal，否则「只含发丝值」的文件会被报告的 touched 门槛漏掉
      stats.skippedTotal += 1
      return match
    }
    // 安全集：px → rpx（×2）
    stats.pxConverted += 1
    converted += 1
    return `${formatRpx(value * PX_TO_RPX, num)}rpx`
  })
  stats.convertedTotal += converted
  return {
    result,
    converted,
    unknown,
  }
}

// ── 样式文本处理 ─────────────────────────────────────────────────────────
/**
 * 按行处理一段样式文本（.scss 全文，或 .vue 的一个 <style> 块内容）。
 * `startLine` 是这段文本第一行在**原文件**里的行号，用于报告可定位。
 */
function processStyle(content, startLine, stats) {
  const lines = content.split('\n')
  const commentState = { inBlock: false }
  const out = []
  let mediaDepth = 0
  let mediaOpened = false
  let currentMedia = null

  for (const [idx, line] of lines.entries()) {
    const lineNo = startLine + idx
    const mask = buildCodeMask(line, commentState)
    const code = maskToCode(line, mask)
    const codeUnits = countUnits(code)

    // ⑨ 注释/字符串内的单位：原文有、掩码后没有 → 计入跳过
    const masked = countUnits(line) - codeUnits
    if (masked > 0) {
      stats.maskedTokens += masked
    }

    // ④ @media：条件行本身也在跳过范围内（断点 px 就在条件里）
    const enteringMedia = mediaDepth === 0 && MEDIA_RE.test(code)
    if (enteringMedia) {
      currentMedia = {
        line: lineNo,
        text: line.trim(),
        skipped: 0,
      }
      stats.media.push(currentMedia)
      mediaOpened = false
    }
    if (enteringMedia || mediaDepth > 0) {
      mediaDepth += braceDelta(code)
      mediaOpened = mediaOpened || code.includes('{')
      if (currentMedia) {
        currentMedia.skipped += codeUnits
        stats.skippedTotal += codeUnits
      }
      if (mediaOpened && mediaDepth <= 0) {
        mediaDepth = 0
        mediaOpened = false
        currentMedia = null
      }
      out.push(line)
      continue
    }

    if (codeUnits === 0) {
      out.push(line)
      continue
    }

    // ⑧ @include：mixin 调用没有属性名，① 的白名单无从匹配 → 整行交手工
    if (INCLUDE_RE.test(code)) {
      stats.includes.push({
        line: lineNo,
        text: line.trim(),
        units: codeUnits,
      })
      stats.skippedTotal += codeUnits
      out.push(line)
      continue
    }

    // ② 变量定义行：CSS 自定义属性 / SCSS 变量，可能被 JS 侧硬编码镜像
    if (VAR_DEF_RE.test(code)) {
      stats.varDefs.push({
        line: lineNo,
        text: line.trim(),
        units: codeUnits,
        calc: CALC_RE.test(code),
      })
      stats.skippedTotal += codeUnits
      out.push(line)
      continue
    }

    // 安全集：声明行（含 ⑤ calc）
    const segments = buildPropertySegments(code)
    const { result, converted, unknown } = transformLine(line, mask, segments, lineNo, stats)
    if (unknown) {
      stats.unknownProperty.push({
        line: lineNo,
        text: line.trim(),
        units: codeUnits,
      })
    }
    if (converted > 0 && CALC_RE.test(code)) {
      stats.calcLines.push({
        line: lineNo,
        text: line.trim(),
      })
    }
    out.push(result)
  }

  return out.join('\n')
}

// ── 单文件处理 ───────────────────────────────────────────────────────────
function processFile(file, stats) {
  const source = readFileSync(file, 'utf8')
  if (file.endsWith('.scss')) {
    return processStyle(source, 1, stats)
  }
  // .vue：只在 <style> 块切片内替换，<script>/<template> 原样保留（③⑥⑦ 类天然排除）
  return source.replace(STYLE_BLOCK_RE, (whole, openTag, content, closeTag, offset) => {
    const startLine = source.slice(0, offset).split('\n').length
    const processed = processStyle(content, startLine, stats)
    return `${openTag}${processed}${closeTag}`
  })
}

// ── 目录遍历 ─────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walk(join(dir, entry.name), out)
      }
      continue
    }
    if (TARGET_EXT_RE.test(entry.name)) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

// ── 报告 ─────────────────────────────────────────────────────────────────
const loc = (file, line) => `${file}:${line}`

function printFileReport(stats, root, changed) {
  const rel = relative(root, stats.file)
  console.log(`\n[${rel}]${changed ? '' : '  （无改动）'}`)
  console.log(
    `  转换 ${stats.convertedTotal} 处（px ${stats.pxConverted} / vw ${stats.vwConverted}）`
    + ` · 跳过 ${stats.skippedTotal} 处 · 注释内 ${stats.maskedTokens} 处`,
  )

  if (stats.hairlineSkipped.length > 0) {
    console.log(`  ① 发丝值按属性名不转（${stats.hairlineSkipped.length}）:`)
    for (const item of stats.hairlineSkipped) {
      console.log(`      :${item.line}  ${item.property}: ${item.token}`)
    }
  }
  if (stats.varDefs.length > 0) {
    console.log(`  ② 变量定义行 → 手工同步 JS 镜像（${stats.varDefs.length}）:`)
    for (const item of stats.varDefs) {
      const tags = item.calc ? '  ← 同时属 ⑤ calc（Q4：算 1 处手工项）' : ''
      console.log(`      :${item.line}  ${item.text}${tags}`)
    }
  }
  if (stats.media.length > 0) {
    console.log(`  ④ @media 整块跳过（${stats.media.length} 块，含 px ${stats.media.reduce((n, m) => n + m.skipped, 0)} 处）:`)
    for (const item of stats.media) {
      console.log(`      :${item.line}  ${item.text}`)
    }
  }
  if (stats.calcLines.length > 0) {
    console.log(`  ⑤ 含 calc 的改动行 → 真机验证混合单位（${stats.calcLines.length}）:`)
    for (const item of stats.calcLines) {
      console.log(`      :${item.line}  ${item.text}`)
    }
  }
  if (stats.includes.length > 0) {
    console.log(`  ⑧ @include 整行跳过 → 手工按 mixin 语义改（${stats.includes.length} 行）:`)
    for (const item of stats.includes) {
      console.log(`      :${item.line}  ${item.text}`)
    }
  }
  if (stats.unknownProperty.length > 0) {
    console.log(`  ⑩ 解析不出属性名 → 已照转，请人工确认（${stats.unknownProperty.length}）:`)
    for (const item of stats.unknownProperty) {
      console.log(`      :${item.line}  ${item.text}`)
    }
  }
}

function printManualChecklist(allStats, root) {
  const vars = allStats.flatMap(s => s.varDefs.map(v => ({
    ...v,
    file: relative(root, s.file),
  })))
  const includes = allStats.flatMap(s => s.includes.map(v => ({
    ...v,
    file: relative(root, s.file),
  })))
  const media = allStats.flatMap(s => s.media.map(v => ({
    ...v,
    file: relative(root, s.file),
  })))
  const calcs = allStats.flatMap(s => s.calcLines.map(v => ({
    ...v,
    file: relative(root, s.file),
  })))
  const unknown = allStats.flatMap(s => s.unknownProperty.map(v => ({
    ...v,
    file: relative(root, s.file),
  })))

  console.log('\n══ 手工处理清单（供人工复核，约 60 处）══')
  console.log('以下位置脚本按设计**不覆盖**或需人工确认，逐条处理后再逐页目视对比：')

  console.log(`\n② CSS/SCSS 变量定义 ${vars.length} 处 —— ⚠️ 必须与 JS 侧硬编码同步`)
  console.log('   （如 useMenuScroll.ts:31 `const stickyHeight = 92`；小程序端 createSelectorQuery')
  console.log('     返回 px 而非 rpx，JS 侧单位策略依赖 Batch 0.5 PoC 第 ③ 项结论）')
  for (const item of vars) {
    console.log(`   ${loc(item.file, item.line)}  ${item.text}`)
  }

  console.log(`\n⑧ @include 参数 ${includes.length} 行 —— 按 mixin 语义还原成属性再判断`)
  for (const item of includes) {
    console.log(`   ${loc(item.file, item.line)}  ${item.text}`)
  }

  console.log(`\n④ @media 断点 ${media.length} 块 —— 保留 px，但断点本身需真机复评是否还会触发`)
  for (const item of media) {
    console.log(`   ${loc(item.file, item.line)}  ${item.text}`)
  }

  console.log(`\n⑤ calc 混合单位 ${calcs.length} 行 —— 已转，需真机验证小程序端支持 calc(rpx + vh/env())`)
  for (const item of calcs) {
    console.log(`   ${loc(item.file, item.line)}  ${item.text}`)
  }

  if (unknown.length > 0) {
    console.log(`\n⑩ 属性名解析失败 ${unknown.length} 行 —— 已照转，请确认不是选择器/多行声明的误伤`)
    for (const item of unknown) {
      console.log(`   ${loc(item.file, item.line)}  ${item.text}`)
    }
  }

  console.log('\n③ 模板属性 px + SkeletonBlock.vue:21 的 normalizeSize —— 脚本按设计不覆盖（在 <template>/<script>）')
  console.log('⑥ <script> 内运行时 px（getBoundingClientRect 来源）—— 脚本按设计不覆盖')
  console.log('⑦ rootMargin 的 px —— 随宿主文件重写，小程序端无 IntersectionObserver')
}

// ── 主流程 ───────────────────────────────────────────────────────────────
function main() {
  const options = parseArgs(process.argv)
  if (options.help) {
    console.log('用法: node apps/uni-user/scripts/px-to-rpx.mjs [目录] [--dry-run|--write]')
    console.log('默认目录 apps/uni-user/src，默认模式 --dry-run（只报告不写盘）。')
    return 0
  }
  if (options.error) {
    return 1
  }

  const root = resolve(options.target ?? DEFAULT_TARGET)
  if (!existsSync(root)) {
    console.error(`目标目录不存在: ${root}`)
    console.error('用法: node apps/uni-user/scripts/px-to-rpx.mjs [目录] [--dry-run|--write]')
    return 1
  }
  const files = walk(root).sort()
  const mode = options.write ? 'write（已写盘）' : 'dry-run（未写盘）'

  console.log('══ px → rpx codemod（一次性脚本，跑完即弃）══')
  console.log(`模式: ${mode}`)
  console.log(`目标: ${root}`)
  console.log(`扫描: ${files.length} 个 .vue/.scss 文件`)

  const allStats = []
  let changedFiles = 0

  for (const file of files) {
    const stats = createStats(file)
    const original = readFileSync(file, 'utf8')
    const result = processFile(file, stats)
    const changed = result !== original
    if (changed) {
      changedFiles += 1
      if (options.write) {
        writeFileSync(file, result, 'utf8')
      }
    }
    const touched = changed || stats.skippedTotal > 0 || stats.maskedTokens > 0
    if (touched) {
      allStats.push(stats)
      printFileReport(stats, root, changed)
    }
  }

  const totals = allStats.reduce(
    (acc, s) => ({
      converted: acc.converted + s.convertedTotal,
      px: acc.px + s.pxConverted,
      vw: acc.vw + s.vwConverted,
      skipped: acc.skipped + s.skippedTotal,
      masked: acc.masked + s.maskedTokens,
      hairline: acc.hairline + s.hairlineSkipped.length,
      vars: acc.vars + s.varDefs.length,
      media: acc.media + s.media.length,
      includes: acc.includes + s.includes.length,
      calc: acc.calc + s.calcLines.length,
      unknown: acc.unknown + s.unknownProperty.length,
    }),
    {
      converted: 0,
      px: 0,
      vw: 0,
      skipped: 0,
      masked: 0,
      hairline: 0,
      vars: 0,
      media: 0,
      includes: 0,
      calc: 0,
      unknown: 0,
    },
  )

  console.log('\n══ 汇总 ══')
  console.log(`文件: ${files.length} 个扫描 / ${changedFiles} 个${options.write ? '已修改' : '待修改'}`)
  console.log(`转换: ${totals.converted} 处（px ${totals.px} × 2 / vw ${totals.vw} × 7.5）`)
  console.log(`跳过: ${totals.skipped} 处（① 发丝 ${totals.hairline} / ②④⑧ ${totals.skipped - totals.hairline}）`)
  console.log(`注释与字符串内: ${totals.masked} 处（⑨）`)
  console.log(`手工清单: ② ${totals.vars} · ④ ${totals.media} 块 · ⑤ ${totals.calc} · ⑧ ${totals.includes} · ⑩ ${totals.unknown}`)

  if (allStats.length > 0) {
    printManualChecklist(allStats, root)
  }

  if (!options.write && totals.converted > 0) {
    console.log('\n⚠️ dry-run 未写盘。确认报告无误后加 --write 执行。')
  }
  console.log('\n⚠️ 报告不等于验收：改完必须逐页与 web-user(dev 5174) 并排目视对比。')
  return 0
}

process.exitCode = main()
