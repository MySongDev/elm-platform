/**
 * 生成 tabBar 的 8 张 PNG 图标（4 个 tab × 未选中/选中 2 态）。
 *
 * 为什么需要它：
 * 微信小程序 pages.json 的 tabBar.list[].iconPath **必须是本地图片路径**，
 * 不能用字体图标（iconfont）也不能用 svg（迁移方案 H 节第 5 点）。
 * 而 tabBar 不配就无法用 switchTab 切换 4 个主页面（navigateTo 到 tabBar 页会失败）。
 *
 * 为什么用 Playwright 而非引入图片库：
 * 仓库已有 @playwright/test 且 chromium 已下载（scripts/run-playwright-e2e.mjs 在用），
 * → 用浏览器把 svg 栅格化成 PNG，**零新增依赖**。
 * 项目内没有 sharp/resvg/svgtofont，系统也没有 ImageMagick/inkscape
 * （Windows 的 convert 是磁盘转换工具，不是 ImageMagick，别误用）。
 *
 * 单色图标染色：源 svg 的 fill 各不相同（eleme 硬编码 #3cabff，其余继承色），
 * tabBar 图标需要「未选中灰 / 选中蓝」两态 → 渲染时强制覆盖所有 path 的 fill。
 *
 * ⚠️ 一次性脚本，跑完即弃。图标定稿后不需要反复生成。
 * 用法: node scripts/generate-tabbar-icons.mjs
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
// 源 svg 在 web-user（本次迁移只读它，不修改）
const SVG_DIR = join(ROOT, '..', 'web-user', 'src', 'icons', 'svg')
const OUT_DIR = join(ROOT, 'src', 'static', 'tabbar')

/** 微信小程序推荐 tabBar 图标尺寸 81×81，单张限制 40KB */
const SIZE = 81

/**
 * tabBar 四个 tab：[输出名, 未选中源 svg, 选中源 svg]
 *
 * ⚠️ msite 两态**形状不同**，这是忠实于 H5 源实现：
 * web-user 的 footGuide.vue:14 写的是
 *   `props.active ? 'eleme' : 'download'`
 * 即未选中用 download.svg（空心描边版饿了么 logo），选中用 eleme.svg（实心版）。
 * 若两态都用 eleme.svg，未选中会变成一块实心灰方块，与 H5 观感不符。
 *
 * 其余三个 tab 在 H5 用 Vant 内置图标（icon="search"/"cart-o"/"user-o"），
 * 项目 svg 里的 search/cart/user 正是同风格描边图标 → 两态同形状、仅换色。
 */
const TABS = [
  ['msite', 'download.svg', 'eleme.svg'],
  ['search', 'search.svg', 'search.svg'],
  ['cart', 'cart.svg', 'cart.svg'],
  ['profile', 'user.svg', 'user.svg'],
]

/** 两态颜色。与 pages.json 的 tabBar.color / selectedColor 一致 */
const STATES = [
  ['', '#999999'], // 未选中：灰
  ['_active', '#0089dc'], // 选中：蓝（$blue 系）
]

/**
 * 把 svg 的所有描边/填充强制改成单色，并撑满 viewBox 居中。
 * ⚠️ 源 svg 有的用 fill、有的用 stroke，有的硬编码颜色 → 一律覆盖成 color。
 */
function recolorSvg(svgText, color) {
  // 去掉 xml 声明与 DOCTYPE（内联进 HTML 时不需要，且 DOCTYPE 会干扰解析）
  let svg = svgText
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .trim()

  // 覆盖已有的 fill/stroke 具体色值为目标色（保留 fill="none" 以免实心块）
  svg = svg.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))"/g, `$1="${color}"`)

  // 给根 <svg> 注入固定宽高，并用 CSS 兜底所有子元素颜色
  svg = svg.replace(
    /<svg([^>]*)>/,
    `<svg$1 width="${SIZE}" height="${SIZE}" style="color:${color}">`,
  )

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    svg{display:block;width:${SIZE}px;height:${SIZE}px}
    svg *{fill:${color};stroke:none}
  </style></head><body>${svg}</body></html>`
}

/**
 * 启动浏览器。
 *
 * ⚠️ 不能直接 chromium.launch()：Playwright 自带的 chromium 版本可能与本机已下载的
 * 不匹配（实测报 `Executable doesn't exist at ...\chromium_headless_shell-1223\...`，
 * 而本机装的是 1148）。本仓库的 playwright 是 e2e 用的，不该为了生成图标去
 * `npx playwright install` 下载 ~100MB 浏览器。
 *
 * 所以按顺序探测系统浏览器：Playwright 自带 → 系统 Chrome → 系统 Edge。
 */
async function launchBrowser() {
  const candidates = [
    { label: 'playwright chromium' },
    {
      label: 'system chrome',
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    },
    {
      label: 'system edge',
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    },
  ]

  for (const candidate of candidates) {
    // 显式路径的先确认文件存在，避免无谓的启动失败日志
    if (candidate.executablePath && !existsSync(candidate.executablePath)) {
      continue
    }

    try {
      const browser = await chromium.launch({
        executablePath: candidate.executablePath,
      })
      console.log(`使用浏览器: ${candidate.label}`)
      return browser
    }
    catch {
      // 换下一个候选
    }
  }

  throw new Error(
    '找不到可用的浏览器。请安装 Chrome/Edge，或运行 npx playwright install chromium',
  )
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await launchBrowser()
  const page = await browser.newPage({
    viewport: {
      width: SIZE,
      height: SIZE,
    },
    // 透明背景：tabBar 图标必须透明底，否则会有白块
    deviceScaleFactor: 2, // 2x 输出，高分屏更清晰（最终仍是 81×81 逻辑尺寸）
  })

  const generated = []

  for (const [name, inactiveSource, activeSource] of TABS) {
    // 两态可能用不同形状的源 svg（msite 就是），按态取对应源
    const sources = [inactiveSource, activeSource]

    for (const [index, [suffix, color]] of STATES.entries()) {
      const svgText = readFileSync(join(SVG_DIR, sources[index]), 'utf8')
      const html = recolorSvg(svgText, color)
      await page.setContent(html, { waitUntil: 'load' })

      const outName = `${name}${suffix}.png`
      const outPath = join(OUT_DIR, outName)

      // 截取整个 body（就是那张 svg）
      await page.locator('body').screenshot({
        path: outPath,
        omitBackground: true,
      })

      const size = readFileSync(outPath).length
      generated.push([outName, size, sources[index], color])
    }
  }

  await browser.close()

  console.log(`生成 tabBar 图标 ${generated.length} 张 → src/static/tabbar/`)
  for (const [outName, size, sourceFile, color] of generated) {
    const flag = size > 40 * 1024 ? ' ⚠️ 超过微信 40KB 限制' : ''
    console.log(`  ${outName.padEnd(22)} ${(size / 1024).toFixed(1).padStart(6)} KB  ← ${sourceFile} @ ${color}${flag}`)
  }

  console.log('\npages.json 的 tabBar 应这样引用（已自动生成，见下）:')
  for (const [name] of TABS) {
    console.log(`  ${name}: iconPath="static/tabbar/${name}.png" selectedIconPath="static/tabbar/${name}_active.png"`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
