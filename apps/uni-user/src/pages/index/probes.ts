/**
 * Batch 0 验证项定义与自动检测逻辑。
 *
 * 每项标注验证方式：
 * - auto: 本文件里能跑出结论（构建期/运行时同步检测）
 * - runtime: 需在微信开发者工具里点按钮触发（依赖网络或小程序运行时 API）
 * - manual: 需人工在开发者工具/真机确认
 *
 * 对应迁移方案 J 节「Batch 0」的 11 项。
 */

import { paymentStatuses } from '@elm-platform/contracts/order'
import { API_BASE_URL, ELM_ASSET_HOST, IMAGE_BASE_URL, IMAGE_ORIGIN_FALLBACKS } from '@/config'

export type ProbeKind = 'auto' | 'runtime' | 'manual'
export type ProbeStatus = 'pass' | 'fail' | 'pending' | 'info'

export interface ProbeItem {
  id: number
  title: string
  kind: ProbeKind
  status: ProbeStatus
  detail: string
}

/** 安全读取构建期环境变量。⚠️ 第 6 项要验的就是这个在小程序端到底有没有值 */
function readEnv(): Record<string, string | undefined> {
  try {
    const env = import.meta.env as unknown as Record<string, string | undefined>
    return {
      VITE_API_BASE_URL: env.VITE_API_BASE_URL,
      MODE: env.MODE,
      NODE_ENV: env.NODE_ENV,
    }
  }
  catch (error) {
    return { error: String(error) }
  }
}

/**
 * 第 10 项：new URL() 在小程序端是否可用。
 * web-user 的 utils/image/imageCandidates.js:24,33 依赖它构造候选 URL；
 * 小程序端 URL 构造器实现不完整，不可用则要改成字符串处理。
 */
export function probeUrlConstructor(): {
  ok: boolean
  detail: string
} {
  const checks: string[] = []
  try {
    const url = new URL('https://example.com/img/shop/a.jpg?x=1')
    checks.push(`origin=${url.origin}`)
    checks.push(`pathname=${url.pathname}`)
    checks.push(`search=${url.search}`)
    // imageCandidates 实际用到的是这几个属性，缺一不可
    const usable = Boolean(url.origin && url.pathname && 'search' in url)
    // 相对路径解析（第二参数形式）也常被用到
    const rel = new URL('shop/a.jpg', 'https://example.com/img/')
    checks.push(`relative=${rel.href}`)
    // 拆解重组一致性：这是 buildImageCandidateUrls 的真实用法
    const base = 'https://example.com/img/shop/a.jpg'
    const parsed = new URL(base)
    checks.push(`rebuilt=${parsed.origin}${parsed.pathname}`)
    const rebuildOk = `${parsed.origin}${parsed.pathname}` === base
    return {
      ok: usable && rebuildOk && rel.href === 'https://example.com/img/shop/a.jpg',
      detail: checks.join(' | '),
    }
  }
  catch (error) {
    return {
      ok: false,
      detail: `抛出异常: ${String(error)}`,
    }
  }
}

/**
 * 第 11 项：workspace 包消费能力。
 * - @elm-platform/api-types 是纯 .d.ts，只在类型层生效 → 构建能过即证明可用
 * - @elm-platform/contracts 是 tsup 的 ESM+CJS 双格式，这里 import 的是**运行时常量值**
 *
 * ⚠️ 已修的存量缺陷：contracts 的 exports.import 原指向 ./dist/index.mjs，
 * 但 tsup 在 "type": "module" 包下实际产出 dist/index.js → ESM 消费方
 * ERR_MODULE_NOT_FOUND。现有两个消费方都没踩到（server 走 require，web-admin 只用
 * import type）。已改为指向真实文件，详见 Batch 0 记录。
 */
export function probeWorkspacePackages(): {
  ok: boolean
  detail: string
} {
  try {
    const isRuntimeValue = Array.isArray(paymentStatuses)
    const hasExpected = paymentStatuses.includes('PENDING')
      && paymentStatuses.includes('PAID')
      && paymentStatuses.includes('CLOSED')
    return {
      ok: isRuntimeValue && hasExpected,
      detail: isRuntimeValue
        ? `contracts 运行时常量可用: [${paymentStatuses.join(', ')}]`
        : 'contracts 导入成功但值不是数组（可能被 tree-shake 或解析到类型声明）',
    }
  }
  catch (error) {
    return {
      ok: false,
      detail: `导入失败: ${String(error)}`,
    }
  }
}

/**
 * 全部 11 项的初始清单。
 * auto 类项在这里就跑出结论；runtime / manual 类初始为 pending，由页面交互或人工更新。
 */
export function createProbes(): ProbeItem[] {
  const env = readEnv()
  const urlProbe = probeUrlConstructor()
  const pkgProbe = probeWorkspacePackages()

  return [
    {
      id: 1,
      title: 'uni-ui 1.5.12 + easycom 自动导入',
      kind: 'runtime',
      status: 'pending',
      detail: '本页已渲染 uni-icons（顶部三个图标）与 uni-popup（点按钮弹出），均由 easycom 规则自动导入，未手动 import 组件。目视确认样式正常 + popup 能弹出即通过。',
    },
    {
      id: 2,
      title: 'pinia 2.x + vue 版本正确',
      kind: 'runtime',
      status: 'pending',
      detail: 'vue 解析为 3.4.21（精确版）、pinia 2.1.7。点「pinia 读写」验证 setup 式 defineStore + storeToRefs。⚠️ 文档原写 pinia ^2.3.1，实测其 peer 要求 vue ^3.5.11 与 3.4.21 冲突（2.2.8 起即如此），故改用 peer 为 ^3.3.0 的 2.1.7。',
    },
    {
      id: 3,
      title: 'Vite 5.2.8 与 monorepo 内 Vite 8 共存',
      kind: 'manual',
      status: 'pending',
      detail: '需在仓库根跑 pnpm build 与 pnpm test 全绿（web-user 仍是 Vite 8 / Vue 3.5 正常构建）。已实测：pnpm why vue = 3.4.21；pinia 双版本共存（uni-user 2.1.7 / web-admin+web-user 3.0.4）。',
    },
    {
      id: 4,
      title: 'uni.request 承载 policies',
      kind: 'runtime',
      status: 'pending',
      detail: '点「请求 /v1/cities」打通真实接口（需后端在 127.0.0.1:3000 运行 + 开发者工具关域名校验）。',
    },
    {
      id: 5,
      title: 'AbortController → RequestTask.abort',
      kind: 'runtime',
      status: 'pending',
      detail: '点「abort 取消」发请求并立即取消。⚠️ 关键判据：取消必须表现为 CanceledError，不能被误判为 TransportError(isNetworkError)，否则 policies 的重试会把主动取消当失败去重试。',
    },
    {
      id: 6,
      title: '.env 在 mp-weixin 构建下是否生效',
      kind: 'auto',
      status: env.VITE_API_BASE_URL ? 'pass' : 'info',
      detail: `VITE_API_BASE_URL=${env.VITE_API_BASE_URL ?? '(未定义)'} | MODE=${env.MODE ?? '?'} | NODE_ENV=${env.NODE_ENV ?? '?'} → 实际生效 API_BASE_URL=${API_BASE_URL}`,
    },
    {
      id: 7,
      title: '小程序连本地后端',
      kind: 'manual',
      status: 'pending',
      detail: '需微信开发者工具关闭「校验合法域名」（manifest.json 已设 mp-weixin.setting.urlCheck=false）。真机预览时 127.0.0.1 不可达，需用局域网 IP 覆盖 VITE_API_HOST_OVERRIDE。',
    },
    {
      id: 8,
      title: '后端图片代理端点可用',
      kind: 'manual',
      status: 'pending',
      detail: '依赖 Batch 1 第 1 项（GET /api/img/*）落地后才能验。当前 IMAGE_BASE_URL 已按代理形态拼接（见第 12 项），前端侧准备就绪。',
    },
    {
      id: 9,
      title: '★ 主包基础体积',
      kind: 'manual',
      status: 'pending',
      detail: '构建 mp-weixin 后用微信开发者工具「代码依赖分析」量主包。这是议题 5 估算 300-500 KB 的最大不确定项，超预期（>700 KB）则分包要更激进。',
    },
    {
      id: 10,
      title: 'new URL() 在小程序端是否可用',
      kind: 'auto',
      status: urlProbe.ok ? 'pass' : 'fail',
      detail: urlProbe.detail,
    },
    {
      id: 11,
      title: 'workspace 包（api-types / contracts）可消费',
      kind: 'auto',
      status: pkgProbe.ok ? 'pass' : 'fail',
      detail: pkgProbe.detail,
    },
    {
      id: 12,
      title: '图片域名已收敛到自己后端（议题 2 / D5）',
      kind: 'auto',
      status: IMAGE_ORIGIN_FALLBACKS.length === 0 && ELM_ASSET_HOST === API_BASE_URL
        ? 'pass'
        : 'fail',
      detail: `ELM_ASSET_HOST=${ELM_ASSET_HOST} | IMAGE_BASE_URL=${IMAGE_BASE_URL} | fallbacks=[${IMAGE_ORIGIN_FALLBACKS.join(',')}]（应为空，避免小程序端请求非白名单域名白白重试）`,
    },
  ]
}
