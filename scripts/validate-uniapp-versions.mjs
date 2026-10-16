/**
 * Validates the uni-app (@dcloudio/*) version policy of apps/uni-user.
 *
 * 迁移方案议题 8 决策 1 的配套防护：CI 加检查，校验所有 `@dcloudio/*` 版本号
 * **完全相同**且**不含 `^`/`~`/tag 名**。这是防止「顺手统一版本」最有效的手段
 * （人手 review 容易漏）。
 *
 * Checks:
 * 1. 所有 `@dcloudio/*` 依赖（含 `@dcloudio/types` 之外）版本号**完全一致**。
 * 2. 版本号是**精确完整版本**：不含 `^`、`~`、`*`、`x`、range 或 dist-tag 名
 *    （如 `latest`、`vue3`、`alpha`、`next`）。
 * 3. `vite` 精确锁 `5.2.8`（`vite-plugin-uni` 的 peerDependencies 要求，非 range）。
 * 4. `vue` 是精确版本且属于 `3.4.x` 线（uni-app 内部精确锁 compiler 3.4.21）。
 * 5. `pinia` 是精确版本且**低于 2.2.8** —— 2.2.8 起 peer 要求 `vue ^3.5.11`，
 *    与 vue 3.4.x 冲突（迁移方案原写 `^2.3.1` 是错的，实测已纠正）。
 * 6. `package.json` **不得**声明 `"type": "module"` —— 会让
 *    `import uni from '@dcloudio/vite-plugin-uni'` 拿到 `{ default: fn }` 而非函数
 *    （该包是 CJS 且用 `exports.default`），构建期报 `uni is not a function`。
 *
 * ⚠️ `@dcloudio/types` 是例外：它用独立的语义化版本线（3.4.31），
 * 不是日期戳版本号，不参与「全部相同」的一致性校验。
 *
 * ── catalog 间接引用 ──
 * `apps/uni-user/package.json` 的版本值走 pnpm catalog（`"catalog:"` /
 * `"catalog:conflicts_vue_3_4_21"`），不是字面版本号。因此本脚本会先读
 * `pnpm-workspace.yaml`，把 catalog 引用**解析成真实版本再校验** ——
 * 否则会把「已经锁对了的版本」误报成违规（uni-user 首次入库时就撞上了）。
 *
 * 解析器刻意是手写的：本步骤在 CI 里排在 `pnpm install` **之前**
 * （见 .github/workflows/ci.yml 的注释「不需要依赖 → 违规时最快失败」），
 * 所以不能依赖任何第三方 YAML 包。只认 workspace 文件里实际出现的两种缩进形态，
 * 解析不到就**报错退出**，绝不静默放过（宁可假失败，不可假通过）。
 *
 * 为什么这些约束是硬的（实测依据见 docs/engineering/007-uniapp-uni-user-constraints.md）：
 * `@dcloudio/uni-app` 的 dist-tag `latest` 指向**活跃发版的 Vue 2 线**（2.0.2-*，
 * peer 含 `@vue/composition-api`）。写 `latest` 能装上能跑、看起来正常，
 * 但运行时是 Vue 2 → `<script setup>`/`ref`/`computed` 行为异常，**发现得很晚**。
 */
import { readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(rootDir, 'apps', 'uni-user', 'package.json')
const workspacePath = join(rootDir, 'pnpm-workspace.yaml')

const dependencyFields = ['dependencies', 'devDependencies']

/**
 * 走**独立语义化版本线**的 @dcloudio 包，不参与「日期戳版本全部相同」的校验。
 *
 * ⚠️ 这两个包容易被误当成 uni-app 全家桶的一部分（本脚本第一版就误报了 uni-ui）：
 * - `@dcloudio/types`: 3.4.31 —— 纯类型声明包，`@dcloudio/uni-app` 的 peerDependencies
 *   精确要求它，但版本号与 uni-app 的日期戳无关
 * - `@dcloudio/uni-ui`: ^1.5.12 —— UI 组件库，正常语义化版本；
 *   实测 peerDependencies 为空 → 与 vue 3.4.21 无冲突（迁移方案 B 节即写 `^1.5.12`）。
 *   它不需要也不应该跟 `3.0.0-5020620260917001` 对齐
 *
 * 需要锁死的是**日期戳版本家族**（8 个包必须同一版本号）：
 * uni-app / uni-mp-weixin / uni-mp-vue / uni-components / uni-i18n /
 * uni-shared / vite-plugin-uni / uni-h5
 */
const DCLOUDIO_VERSION_EXEMPT = new Set([
  '@dcloudio/types',
  '@dcloudio/uni-ui',
])

/** vite-plugin-uni 的 peerDependencies 精确锁（实测非 range） */
const REQUIRED_VITE_VERSION = '5.2.8'

/** uni-app 内部精确锁 @vue/compiler-* = 3.4.21，故运行时 vue 必须留在 3.4.x 线 */
const REQUIRED_VUE_MAJOR_MINOR = '3.4'

/** pinia 2.2.8 起 peer 要求 vue ^3.5.11 → 与 vue 3.4.x 冲突，必须低于此版本 */
const PINIA_MAX_EXCLUSIVE = [2, 2, 8]

/** 精确完整版本号：3.0.0-5020620260917001 这类日期戳，或 1.2.3 */
const EXACT_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?$/i

/** dist-tag 名与其他非精确写法（用于给出更明确的错误提示） */
const KNOWN_DIST_TAGS = new Set([
  'latest',
  'next',
  'alpha',
  'vue3',
  'nvue3',
  'beta',
  'rc',
])

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

/** 去掉 YAML 标量两端的引号（workspace 文件里包名有 `'@dcloudio/uni-app'` 这种写法） */
function unquote(value) {
  const trimmed = value.trim()

  if (
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
    || (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/**
 * 把 `key: value` 形态的行拆成 [key, value]。value 允许为空（命名 catalog 的标题行）。
 *
 * 刻意用 indexOf 而不是 `/^([^:]+):\s*(.+)$/`：后者的 `\s*` 与 `.+` 可交换字符，
 * eslint-plugin-regexp 判定为可被利用的多项式回溯（catalog 段虽短，但没必要留这个形状）。
 */
function splitKeyValue(line) {
  const separator = line.indexOf(':')

  if (separator <= 0) {
    return null
  }
  return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
}

/** 顶层键（缩进 0，形如 `catalog:`）——返回键名，非顶层键形态返回 null */
function parseTopLevelKey(content) {
  const pair = splitKeyValue(content)

  if (!pair || pair[1] !== '') {
    return null
  }
  return unquote(pair[0])
}

/**
 * 处理 `catalogs:` 段：缩进 2 = 命名 catalog 标题，缩进 4 = 该 catalog 下的条目。
 * 返回新的 currentNamed（标题行推进，其余情况沿用）。
 */
function consumeNamedCatalog(catalogs, content, indent, currentNamed) {
  if (indent === 2) {
    const named = parseTopLevelKey(content)

    if (!named) {
      return null
    }

    if (!catalogs.has(named)) {
      catalogs.set(named, new Map())
    }
    return named
  }

  if (indent === 4 && currentNamed) {
    const entry = splitKeyValue(content)

    if (entry && entry[1] !== '') {
      catalogs.get(currentNamed).set(unquote(entry[0]), unquote(entry[1]))
    }
  }
  return currentNamed
}

/**
 * 解析 pnpm-workspace.yaml 的 `catalog:` 与 `catalogs:` 两段。
 *
 * 返回 Map<catalogName, Map<pkgName, version>>，其中**默认 catalog 的 key 是空串**
 * （对应 package.json 里写 `"catalog:"`），命名 catalog 的 key 是
 * `conflicts_vue_3_4_21` 这类（对应 `"catalog:conflicts_vue_3_4_21"`）。
 *
 * 只认这个文件里实际出现的三种缩进：0 = 顶层键，2 = 条目/命名 catalog，
 * 4 = 命名 catalog 下的条目。不做通用 YAML 解析（不需要，也不该在 install 前引依赖）。
 */
function parseCatalogs(yamlText) {
  const catalogs = new Map([['', new Map()]])

  let section = null // 'catalog' | 'catalogs' | 'other'
  let currentNamed = null

  for (const rawLine of yamlText.split(/\r?\n/)) {
    // 剥离行尾注释（catalog 段的值里不含 #，直接剥是安全的）
    const line = rawLine.replace(/\s+#.*$/, '')

    if (!line.trim()) {
      continue
    }

    const indent = line.length - line.trimStart().length
    const content = line.trim()

    if (indent === 0) {
      const key = parseTopLevelKey(content)
      section = (key === 'catalog' || key === 'catalogs') ? key : 'other'
      currentNamed = null
      continue
    }

    if (section === 'catalog' && indent === 2) {
      const entry = splitKeyValue(content)

      if (entry && entry[1] !== '') {
        catalogs.get('').set(unquote(entry[0]), unquote(entry[1]))
      }
      continue
    }

    if (section === 'catalogs') {
      currentNamed = consumeNamedCatalog(catalogs, content, indent, currentNamed)
    }
  }

  return catalogs
}

/**
 * 把 manifest 里的 `catalog:` / `catalog:<name>` 替换成 workspace 中的真实版本号。
 *
 * ⚠️ 解析不到一律记为错误，**不回退成按字面值校验**：catalog 段缺失或条目缺失
 * 意味着配置已经坏了，此时静默放过 = 假通过，比假失败危险得多。
 */
function resolveManifest(manifest, catalogs) {
  const errors = []
  const relativeManifest = relative(rootDir, manifestPath).replace(/\\/g, '/')
  const resolved = { ...manifest }

  for (const field of dependencyFields) {
    const deps = manifest[field]

    if (!deps) {
      continue
    }

    const resolvedDeps = { ...deps }

    for (const [name, range] of Object.entries(deps)) {
      if (typeof range !== 'string' || !range.startsWith('catalog:')) {
        continue
      }

      const catalogName = range.slice('catalog:'.length).trim()
      const bucket = catalogs.get(catalogName)

      if (!bucket) {
        errors.push(
          `${relativeManifest}: "${name}" 引用了 "${range}"，`
          + '但 pnpm-workspace.yaml 里找不到这个 catalog 段',
        )
        continue
      }

      const version = bucket.get(name)

      if (!version) {
        errors.push(
          `${relativeManifest}: "${name}" 引用了 "${range}"，`
          + `但该 catalog 段里没有 "${name}" 这一项`,
        )
        continue
      }

      resolvedDeps[name] = version
    }

    resolved[field] = resolvedDeps
  }

  return {
    resolved,
    errors,
  }
}

function collectDcloudioVersions(manifest) {
  const versions = new Map()

  for (const field of dependencyFields) {
    const deps = manifest[field]

    if (!deps) {
      continue
    }

    for (const [name, range] of Object.entries(deps)) {
      if (!name.startsWith('@dcloudio/')) {
        continue
      }
      versions.set(name, {
        field,
        range,
      })
    }
  }

  return versions
}

/** 把 "2.1.7" 解析成 [2, 1, 7]；无法解析时返回 null */
function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)

  if (!match) {
    return null
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** a < b ? */
function semverLessThan(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] < b[i]
    }
  }
  return false
}

function describeBadRange(name, range) {
  if (KNOWN_DIST_TAGS.has(range.toLowerCase())) {
    return `"${name}" 用了 dist-tag "${range}"。tag 是可变指针，每次 install 解析到不同版本 → 构建不可复现；且 @dcloudio/uni-app 的 latest 指向 Vue 2 线（能跑但运行时是 Vue2，发现得很晚）`
  }
  if (range.startsWith('^') || range.startsWith('~')) {
    return `"${name}" 用了 range 前缀 "${range}"。@dcloudio/* 用日期戳做版本号，语义化 range 无意义且会解析到别的线`
  }
  if (range === 'workspace:*' || range.startsWith('npm:')) {
    return `"${name}" 用了 "${range}"，不是精确版本号`
  }
  if (!EXACT_VERSION_PATTERN.test(range)) {
    return `"${name}" 的版本 "${range}" 不是精确完整版本号（期望形如 3.0.0-5020620260917001）`
  }
  return null
}

function checkVersionPolicy(manifest) {
  const errors = []
  const relativeManifest = relative(rootDir, manifestPath).replace(/\\/g, '/')

  // ── 检查 6：不能声明 type: module ──
  if (manifest.type === 'module') {
    errors.push(
      `${relativeManifest}: 不得声明 "type": "module"。`
      + '@dcloudio/vite-plugin-uni 是 CJS 包（exports.default = uniPlugin），'
      + '声明后 Node 的 ESM↔CJS 互操作会让 `import uni from ...` 拿到 { default: fn } 而非函数，'
      + '构建期报 "uni is not a function"',
    )
  }

  // ── 检查 1 + 2：@dcloudio/* 版本一致且为精确版本 ──
  const dcloudio = collectDcloudioVersions(manifest)

  if (dcloudio.size === 0) {
    errors.push(`${relativeManifest}: 未找到任何 @dcloudio/* 依赖，脚本可能已失效`)
  }

  const pinnedVersions = new Set()

  for (const [name, { range }] of dcloudio) {
    // ⚠️ 豁免包（types / uni-ui）走独立语义化版本线，不受「精确日期戳版本」约束，
    // 也不参与「全部相同」校验。必须先跳过，否则 describeBadRange 会把
    // `@dcloudio/uni-ui: ^1.5.12` 误报为 range 错误（本脚本第一版的真实 bug）。
    if (DCLOUDIO_VERSION_EXEMPT.has(name)) {
      continue
    }

    const rangeProblem = describeBadRange(name, range)

    if (rangeProblem) {
      errors.push(`${relativeManifest}: ${rangeProblem}`)
      continue
    }

    pinnedVersions.add(range)
  }

  if (pinnedVersions.size > 1) {
    errors.push(
      `${relativeManifest}: 所有 @dcloudio/* 包必须同一版本号（混用会崩），`
      + `实测发现 ${pinnedVersions.size} 个不同版本: ${[...pinnedVersions].join(', ')}`,
    )
  }

  // ── 检查 3：vite 精确锁 ──
  const viteVersion = manifest.devDependencies?.vite ?? manifest.dependencies?.vite

  if (!viteVersion) {
    errors.push(`${relativeManifest}: 缺少 vite 依赖（@dcloudio/vite-plugin-uni 的 peer 精确锁 ${REQUIRED_VITE_VERSION}）`)
  }
  else if (viteVersion !== REQUIRED_VITE_VERSION) {
    errors.push(
      `${relativeManifest}: vite 必须精确锁 "${REQUIRED_VITE_VERSION}"`
      + `（@dcloudio/vite-plugin-uni 的 peerDependencies 精确要求，非 range），实测 "${viteVersion}"`,
    )
  }

  // ── 检查 4：vue 精确且属 3.4.x ──
  const vueVersion = manifest.dependencies?.vue ?? manifest.devDependencies?.vue

  if (!vueVersion) {
    errors.push(`${relativeManifest}: 缺少 vue 依赖`)
  }
  else if (!EXACT_VERSION_PATTERN.test(vueVersion)) {
    errors.push(
      `${relativeManifest}: vue 必须写精确版本（不带 ^ 或 ~），实测 "${vueVersion}"。`
      + `vue 的 dist-tag latest 是 3.5.x，写 ^${REQUIRED_VUE_MAJOR_MINOR}.x 会解析到 3.5，`
      + '与 uni-app 内部精确锁的 @vue/compiler-* 3.4.21 错配',
    )
  }
  else if (!vueVersion.startsWith(`${REQUIRED_VUE_MAJOR_MINOR}.`)) {
    errors.push(
      `${relativeManifest}: vue 必须留在 ${REQUIRED_VUE_MAJOR_MINOR}.x 线`
      + `（uni-app 内部精确锁 @vue/compiler-core|dom|sfc|shared = 3.4.21），实测 "${vueVersion}"`,
    )
  }

  // ── 检查 5：pinia 精确且 < 2.2.8 ──
  const piniaVersion = manifest.dependencies?.pinia ?? manifest.devDependencies?.pinia

  if (!piniaVersion) {
    errors.push(`${relativeManifest}: 缺少 pinia 依赖`)
  }
  else if (!EXACT_VERSION_PATTERN.test(piniaVersion)) {
    errors.push(
      `${relativeManifest}: pinia 必须写精确版本（不带 ^ 或 ~），实测 "${piniaVersion}"。`
      + '⚠️ 迁移方案原写 ^2.3.1 是错的：2.2.8 起 peer 要求 vue ^3.5.11，与 vue 3.4.x 冲突',
    )
  }
  else {
    const parsed = parseSemver(piniaVersion)

    if (!parsed) {
      errors.push(`${relativeManifest}: pinia 版本 "${piniaVersion}" 无法解析`)
    }
    else if (!semverLessThan(parsed, PINIA_MAX_EXCLUSIVE)) {
      errors.push(
        `${relativeManifest}: pinia 必须低于 ${PINIA_MAX_EXCLUSIVE.join('.')}`
        + `（2.2.8 起 peerDependencies 要求 vue ^3.5.11，与本包的 vue ${REQUIRED_VUE_MAJOR_MINOR}.x 冲突），`
        + `实测 "${piniaVersion}"。2.x 里最高可用版是 2.1.7（peer ^3.3.0）`,
      )
    }
  }

  // ── 附加检查：不得走**根 catalog** ──
  // 根 catalog 是 vue ^3.5.26 / vite ^8.0.16 / pinia ^3.0.4，与 uni-app 的硬约束直接冲突。
  // ⚠️ 只查裸 `"catalog:"`。命名 catalog（`catalog:conflicts_vue_3_4_21`）存在的**唯一目的**
  // 就是绕开根 catalog 锁到安全版本，把它也算违规是错的（uni-user 入库时就是这么误报的）。
  // 版本解析后，误用根 catalog 也会被下面的精确版本检查兜住，这里只是给更明确的提示。
  for (const field of dependencyFields) {
    const deps = manifest[field]

    if (!deps) {
      continue
    }

    for (const [name, range] of Object.entries(deps)) {
      if (range === 'catalog:' && ['vue', 'vite', 'pinia', 'vitest'].includes(name)) {
        errors.push(
          `${relativeManifest}: "${name}" 不得走根 catalog（"catalog:"）。`
          + 'catalog 里是 vue ^3.5.26 / vite ^8.0.16 / pinia ^3.0.4，'
          + '与 uni-app 锁的 vue 3.4.21 / vite 5.2.8 直接冲突；'
          + '应改用命名 catalog（如 catalog:conflicts_vue_3_4_21）',
        )
      }
    }
  }

  return errors
}

async function main() {
  let manifest

  try {
    manifest = await readJson(manifestPath)
  }
  catch (error) {
    console.error(`无法读取 ${manifestPath}:`, error.message)
    process.exit(1)
  }

  // manifest 里的版本值可能是 catalog 引用，先解析成真实版本再校验。
  // workspace 读不到 / catalog 段缺失都算硬错误 —— 本步骤在 install 前跑，
  // 拿不到真实版本就无法判断版本策略是否被破坏，绝不能静默放过。
  let catalogText

  try {
    catalogText = await readFile(workspacePath, 'utf8')
  }
  catch (error) {
    console.error(`无法读取 ${workspacePath}:`, error.message)
    process.exit(1)
  }

  const catalogs = parseCatalogs(catalogText)
  const { resolved: resolvedManifest, errors: catalogErrors } = resolveManifest(manifest, catalogs)

  if (catalogErrors.length > 0) {
    console.error('uni-app 版本策略校验失败（catalog 解析）:')
    for (const error of catalogErrors) {
      console.error(`  - ${error}`)
    }
    console.error('')
    console.error('约束依据见 docs/engineering/007-uniapp-uni-user-constraints.md')
    process.exit(1)
  }

  const errors = checkVersionPolicy(resolvedManifest)

  if (errors.length > 0) {
    console.error('uni-app 版本策略校验失败:')
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    console.error('')
    console.error('约束依据见 docs/engineering/007-uniapp-uni-user-constraints.md')
    console.error('升级 uni-app 必须是一次专门的、有验证的动作（改完重跑 Batch 0 全部验证项），不能顺手 pnpm update')
    process.exit(1)
  }

  const dcloudio = collectDcloudioVersions(resolvedManifest)
  const pinnedFamily = [...dcloudio.entries()].filter(([name]) => !DCLOUDIO_VERSION_EXEMPT.has(name))
  const pinned = new Set(pinnedFamily.map(([, info]) => info.range))

  console.log(`uni-app 版本策略校验通过（apps/uni-user）:`)
  console.log(`  @dcloudio/* 统一版本: ${[...pinned].join(', ')} (${pinnedFamily.length} 个包)`)
  console.log(`  豁免包（独立版本线）: ${[...DCLOUDIO_VERSION_EXEMPT].join(', ')}`)
  console.log(`  vite: ${resolvedManifest.devDependencies?.vite ?? '(未声明)'}`)
  console.log(`  vue: ${resolvedManifest.dependencies?.vue ?? '(未声明)'}`)
  console.log(`  pinia: ${resolvedManifest.dependencies?.pinia ?? '(未声明)'}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
