/**
 * 把 web-user 的单色 svg 图标转成 iconfont 字体（ttf + css）。
 *
 * 为什么用 iconfont 而非保留 svg sprite（迁移方案 H 节）：
 * 小程序端**不支持 `<svg>` 标签，也不支持 sprite**（`<use href="#icon-x">`）。
 * 字体图标的优势：
 * - 天然支持 `color` 继承（web-user 的 SvgIcon 默认单色 `fill: var(--icon-fill, currentColor)`）
 * - 三端通用、体积小于 PNG
 * - 可保持 `<SvgIcon icon-name="xxx">` 调用方 API 不变（内部改 `<text class="iconfont icon-xxx">`）
 *
 * ⚠️ 只转**单色**图标（38 个）。真多色 / 含渐变的 3 个（fengniao / cart-icon /
 * sdk_icon_zhifubao@2x）**不转** —— 字体会丢失颜色信息，它们走 PNG 兜底
 * （SvgIcon 的 multicolor 模式）。分类依据见 007 文档。
 *
 * ⚠️ 一次性脚本，跑完即弃（图标定稿后不需要反复生成）。
 * 产物进 src/static/iconfont/，会被打进小程序包。
 *
 * 用法: node scripts/generate-iconfont.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import svgtofont from 'svgtofont'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// 源 svg 在 web-user（只读，不修改）
const SVG_DIR = join(ROOT, '..', 'web-user', 'src', 'icons', 'svg')
const OUT_DIR = join(ROOT, 'src', 'static', 'iconfont')

/**
 * 不转字体的图标及原因。
 * ⚠️ 这些在 SvgIcon 的 multicolor 模式下走 PNG 兜底，调用方 API 不变。
 */
const EXCLUDE = new Map([
  ['fengniao.svg', '真多色（3 个色值），字体会丢色'],
  ['cart-icon.svg', '含 linearGradient/clipPath，字体不支持'],
  ['sdk_icon_zhifubao@2x.svg', '含 defs/clipPath，字体不支持'],
])

/**
 * 单色判定：非白/黑的不同色值 ≤ 1 个，且不含渐变/defs/clipPath。
 * 与 007 文档的分类口径一致（颜色由 CSS color 控制，源色值无所谓）。
 */
function isMonochrome(svgText) {
  if (/<linearGradient|<radialGradient|<defs|clipPath|<image/i.test(svgText)) {
    return false
  }
  const colors = new Set()
  for (const match of svgText.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))"/g)) {
    const color = match[1].toLowerCase()
    if (!['#fff', '#ffffff', '#000', '#000000', 'none'].includes(color)) {
      colors.add(color)
    }
  }
  return colors.size <= 1
}

async function main() {
  const files = readdirSync(SVG_DIR).filter(name => name.endsWith('.svg'))
  const included = []
  const skipped = []

  for (const name of files) {
    if (EXCLUDE.has(name)) {
      skipped.push([name, EXCLUDE.get(name)])
      continue
    }
    const text = readFileSync(join(SVG_DIR, name), 'utf8')
    if (!isMonochrome(text)) {
      skipped.push([name, '判定为多色（色值 > 1）'])
      continue
    }
    included.push(name)
  }

  console.log(`纳入字体: ${included.length} 个；跳过: ${skipped.length} 个`)
  for (const [name, reason] of skipped) {
    console.log(`  跳过 ${name.padEnd(28)} ${reason}`)
  }

  // svgtofont 需要一个只含待转 svg 的输入目录 → 先复制过去
  const STAGE_DIR = join(ROOT, '.iconfont-stage')
  rmSync(STAGE_DIR, {
    recursive: true,
    force: true,
  })
  mkdirSync(STAGE_DIR, { recursive: true })
  for (const name of included) {
    writeFileSync(join(STAGE_DIR, name), readFileSync(join(SVG_DIR, name), 'utf8'))
  }

  // ⚠️ 不 rmSync 整个 OUT_DIR：Windows 下目录句柄可能被占用（EBUSY）。
  // 只删目录内的文件即可达到「重新生成」的效果。
  mkdirSync(OUT_DIR, { recursive: true })
  for (const stale of readdirSync(OUT_DIR)) {
    rmSync(join(OUT_DIR, stale), { force: true })
  }

  await svgtofont({
    src: STAGE_DIR,
    dist: OUT_DIR,
    fontName: 'elm-iconfont',
    // ⚠️ 只出 ttf + css。woff/woff2/eot/svg 都不要：
    // - 小程序 @font-face 用 ttf（base64 内联）即可，woff2 需 ttf2woff2 的原生编译
    //   （postinstall 是 node-gyp，本机未批准构建，且没必要）
    // - 少几种格式 = 少几十 KB 包体积
    // ⚠️ 选项名是 excludeFormat（数组）。实测 generateFonts 会被静默忽略、全格式照出。
    excludeFormat: ['eot', 'woff', 'woff2', 'svg', 'symbol.svg'],
    css: {
      fontSize: '16px',
    },
    // 类名前缀。SvgIcon 组件内部拼 `icon-${name}`，与 web-user 的 #icon-xxx 对齐
    classNamePrefix: 'icon',
    types: [], // 不要 ts 声明（组件自己维护 iconName 类型）
    // ⚠️ **不要**开 useNameAsUnicode：实测它会让 css 只生成基类、
    // 丢失全部 `.icon-xxx::before { content: "\eXXX" }` 图标类
    // （svgtofont 的类生成逻辑在 else 分支，开了它就跳过）。
  })

  rmSync(STAGE_DIR, {
    recursive: true,
    force: true,
  })

  // ── 后处理 1：删掉小程序用不到的格式 ──
  // svgtofont 即便配了 excludeFormat 仍会输出 less/styl/scss 等预处理器副本，
  // 小程序只需要 css + ttf，其余纯占包体积。
  for (const redundant of ['less', 'module.less', 'styl', 'scss']) {
    rmSync(join(OUT_DIR, `elm-iconfont.${redundant}`), { force: true })
  }

  // ── 后处理 2：把 ttf 内联成 base64 ──
  // ⚠️ 微信小程序的 @font-face **不支持本地文件路径**（url('xxx.ttf') 会静默失败，
  // 图标全部不显示且无报错），只支持 base64 data URI 或网络 URL。
  // 网络 URL 要备案域名 + 额外请求，base64 内联最稳。
  // 体积账：ttf 7.9 KB → base64 约 10.6 KB，可接受（对比 uni-icons 内联 53.3 KB）。
  const ttfPath = join(OUT_DIR, 'elm-iconfont.ttf')
  const cssPath = join(OUT_DIR, 'elm-iconfont.css')
  const ttfBase64 = readFileSync(ttfPath).toString('base64')
  let css = readFileSync(cssPath, 'utf8')

  css = css.replace(
    /src:\s*url\('elm-iconfont\.ttf[^']*'\)\s*format\('truetype'\);/,
    `src: url('data:font/truetype;charset=utf-8;base64,${ttfBase64}') format('truetype');`,
  )
  writeFileSync(cssPath, css, 'utf8')

  // 汇报产物
  for (const name of readdirSync(OUT_DIR)) {
    const size = readFileSync(join(OUT_DIR, name)).length
    console.log(`  ${name.padEnd(28)} ${(size / 1024).toFixed(1)} KB`)
  }

  if (!existsSync(ttfPath)) {
    throw new Error('未生成 elm-iconfont.ttf，svgtofont 配置可能有误')
  }
  if (!css.includes('data:font/truetype')) {
    throw new Error('base64 内联失败：css 里没有 data:font/truetype，@font-face 的 url 形态可能变了')
  }

  // 内联成功后删掉 ttf 文件本身：它已被 base64 吸收进 css，
  // 留在 static/ 会被原样拷进小程序包，纯占 ~8 KB 死重。
  rmSync(ttfPath, { force: true })

  console.log(`\n✅ ttf 已 base64 内联进 css（小程序 @font-face 不支持本地路径），ttf 文件已删`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
