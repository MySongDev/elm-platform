/**
 * 生成多色图标的 PNG 兜底图（SvgIcon 的 multicolor 模式用）。
 *
 * 为什么需要：iconfont 字体**只能单色**（颜色走 CSS color），
 * 真多色 / 含渐变的 3 个图标转字体会丢色 → 用 PNG 保留原色。
 *
 * 与 generate-tabbar-icons.mjs 的区别：
 * - 那里要**强制染色**（tabBar 两态灰/蓝），这里要**保留原色**
 * - 那里尺寸 81×81（tabBar 规格），这里 128×128（业务图标，2x 下够清晰）
 *
 * ⚠️ 一次性脚本，跑完即弃。
 * 用法: node scripts/generate-multicolor-png.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SVG_DIR = join(ROOT, '..', 'web-user', 'src', 'icons', 'svg')
const OUT_DIR = join(ROOT, 'src', 'static', 'icons-png')

/** 输出尺寸。业务图标按 2x 出图，1em 渲染时够清晰 */
const SIZE = 128

/**
 * 需要 PNG 兜底的图标（与 generate-iconfont.mjs 的 EXCLUDE 保持一致）。
 * ⚠️ 两处清单必须同步：字体跳过谁，这里就要给谁出 PNG。
 */
const MULTICOLOR = ['fengniao.svg', 'cart-icon.svg', 'sdk_icon_zhifubao@2x.svg', 'backtop.svg']

/**
 * 保留原色渲染。
 * ⚠️ 与 tabBar 脚本相反：这里**不覆盖** fill/stroke，只给根 svg 定尺寸。
 * 含 defs/clipPath 的 svg 依赖内部引用，原样内联即可（浏览器会解析）。
 */
function wrapSvg(svgText) {
  const svg = svgText
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .trim()
    .replace(/<svg([^>]*)>/, `<svg$1 width="${SIZE}" height="${SIZE}">`)

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    svg{display:block;width:${SIZE}px;height:${SIZE}px}
  </style></head><body>${svg}</body></html>`
}

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

  throw new Error('找不到可用的浏览器。请安装 Chrome/Edge，或运行 npx playwright install chromium')
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // 校验清单里的文件都存在（防止 web-user 侧改名后静默漏图）
  const missing = MULTICOLOR.filter(name => !readdirSync(SVG_DIR).includes(name))
  if (missing.length > 0) {
    throw new Error(`清单里的 svg 在 web-user 不存在: ${missing.join(', ')}。请同步两处清单`)
  }

  const browser = await launchBrowser()
  const page = await browser.newPage({
    viewport: {
      width: SIZE,
      height: SIZE,
    },
    deviceScaleFactor: 2,
  })

  const generated = []

  for (const sourceFile of MULTICOLOR) {
    const html = wrapSvg(readFileSync(join(SVG_DIR, sourceFile), 'utf8'))
    await page.setContent(html, { waitUntil: 'load' })

    // 输出名去掉 .svg 与 @2x 后缀（组件里拼 `${iconName}.png`）
    const outName = `${sourceFile.replace(/@2x\.svg$/, '').replace(/\.svg$/, '')}.png`
    const outPath = join(OUT_DIR, outName)

    await page.locator('body').screenshot({
      path: outPath,
      omitBackground: true,
    })

    generated.push([outName, readFileSync(outPath).length, sourceFile])
  }

  await browser.close()

  // 清理目录里已不在清单的旧文件（防止图标改名后留下死文件占包）
  const valid = new Set(generated.map(([name]) => name))
  for (const stale of readdirSync(OUT_DIR)) {
    if (!valid.has(stale)) {
      rmSync(join(OUT_DIR, stale), { force: true })
      console.log(`  清理旧文件: ${stale}`)
    }
  }

  console.log(`生成多色图标 PNG ${generated.length} 张 → src/static/icons-png/`)
  for (const [outName, size, sourceFile] of generated) {
    console.log(`  ${outName.padEnd(28)} ${(size / 1024).toFixed(1)} KB  ← ${sourceFile}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
