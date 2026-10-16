/**
 * 平台适配收口层 —— 图片 URL 构建与候选回退
 *
 * ⚠️ 与 apps/web-user/src/utils/image/imageCandidates.js 同源，但**刻意改掉了实现方式**：
 * web-user 用 `new URL()` 拆解，本文件用纯字符串处理。
 *
 * 原因：迁移方案 Batch 0 第 10 项要求实测「`new URL()` 在小程序端是否可用」
 * （`imageCandidates.js:24,33` 依赖它），而该项**必须在微信开发者工具里人工验证**，
 * 无法在构建期确认。在结论出来之前依赖它是有风险的 —— 小程序端的 URL 构造器
 * 已知实现不完整。字符串处理无论 URL 是否可用都能工作，是防御性正确的选择。
 * 若第 10 项验证为「可用」，本实现依然正确，不需要改回去。
 */

import {
  API_BASE_URL,
  getImageUrl as buildImageUrl,
  getUploadUrl as buildUploadUrl,
  DEFAULT_RESTAURANT_IMAGE,
  IMAGE_ORIGIN_FALLBACKS,
} from '@/config'

/**
 * 拆出 URL 的 origin 部分（`协议://主机[:端口]`）。
 * @returns origin 字符串；无法识别为绝对 URL 时返回 null
 */
export function parseOrigin(url: string): string | null {
  // 只认 http/https，且 // 之后必须有非斜杠字符（避免把 `//evil.com` 当合法 origin）
  const match = /^(https?:\/\/)([^/?#]+)/i.exec(url)

  if (!match) {
    return null
  }
  return `${match[1]}${match[2]}`
}

/**
 * 拆出 URL 的 origin 之后部分（pathname + search + hash）。
 * @returns 以 `/` 开头的字符串；无法识别时返回 null
 */
export function parsePathAndQuery(url: string): string | null {
  const origin = parseOrigin(url)

  if (!origin) {
    return null
  }
  const rest = url.slice(origin.length)
  return rest.startsWith('/') ? rest : `/${rest}`
}

/**
 * 根据完整图片 URL 生成候选列表（主 URL + 替换 origin 后的备用 URL）。
 *
 * ⚠️ **uni-user 的默认 fallback 是空数组**（见 config/index.ts 的 IMAGE_ORIGIN_FALLBACKS），
 * 所以默认情况下本函数只返回 `[url]` 单元素数组。这是迁移方案 D5 的决策：
 * 改走后端代理后，回退到第三方域名 `elm.cangdu.org` 在小程序端**必然失败**
 * （不在合法域名白名单），只会白白消耗一次重试 → 容错应收敛到后端代理内部。
 *
 * 保留本函数的意义：
 * 1. 与 web-user 同源的调用方接口（SmartImage 三件套重写时可直接用）
 * 2. 将来接入自己的 CDN 时，可通过 VITE_IMAGE_ORIGIN_FALLBACKS 恢复多级回退
 */
export function buildImageCandidateUrls(
  url: string,
  extraOrigins: string[] = IMAGE_ORIGIN_FALLBACKS,
): string[] {
  if (!url || typeof url !== 'string') {
    return []
  }

  const out: string[] = []
  const seen = new Set<string>()

  const push = (candidate: string) => {
    if (!candidate || seen.has(candidate)) {
      return
    }
    seen.add(candidate)
    out.push(candidate)
  }

  push(url)

  const pathAndQuery = parsePathAndQuery(url)

  // 拆不出 origin（相对路径 / data: URI）→ 无法做 origin 替换，只返回主 URL
  if (!pathAndQuery) {
    return out
  }

  for (const origin of extraOrigins) {
    if (!origin || typeof origin !== 'string') {
      continue
    }
    const fallbackOrigin = parseOrigin(origin.replace(/\/+$/, ''))

    // 非法 fallback origin 直接跳过（与 web-user 的 catch-ignore 行为一致）
    if (!fallbackOrigin) {
      continue
    }
    push(`${fallbackOrigin}${pathAndQuery}`)
  }

  return out
}

/**
 * 取图片 URL。转发到 config 的 getImageUrl（走后端图片代理）。
 *
 * 9 个调用方文件（utils/cart.ts、ShopItem.vue、MenuFoodItem.vue、CategoryMenu.vue、
 * ShopHeader.vue、SearchHome.vue、ProfileCard.vue、AvatarUploader.vue、config 自身）
 * 全部走这个入口 → 改代理时它们一行都不用改（迁移方案议题 2）。
 */
export function getImageUrl(path?: string | null): string {
  return buildImageUrl(path)
}

/** 取上传资源 URL（头像等）。指向自己后端的 /uploads/，备案域名下可用 */
export function getUploadUrl(path?: string | null): string {
  return buildUploadUrl(path)
}

/** 占位图。⚠️ 它也走代理（`187bcca1ec6114376.jpg` 实测上游 200、5399 bytes） */
export const PLACEHOLDER_IMAGE = DEFAULT_RESTAURANT_IMAGE

/**
 * 取轮播图（食品分类）URL。
 *
 * ★ 走后端代理的 **cdn 子路由**（`/api/img/cdn/X` → fuss10.elemecdn.com/X）。
 * 实测（2026-09-28）：`/v2/index_entry` 返回的 image_url（形如 `/2/35/xxx.jpeg`）
 * 只在 `fuss10.elemecdn.com` 可达（200），走默认代理路由（elm.cangdu.org/img）是 404。
 * web-user 的 msite.vue:29 硬编码 fuss10 域名，小程序白名单不放行 → 必须走代理。
 * 后端路由方式见 elm-image-proxy.service.ts 的 CDN_UPSTREAM_PREFIX 注释。
 */
export function getCarouselImageUrl(path?: string | null): string {
  if (!path) {
    return PLACEHOLDER_IMAGE
  }
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith('data:')) {
    return path
  }
  return `${API_BASE_URL}/img/cdn${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * 图片加载失败时取下一个候选。
 *
 * 用法（配合 `<image @error>`）：
 * ```ts
 * const candidates = ref(buildImageCandidateUrls(getImageUrl(item.image_path)))
 * const index = ref(0)
 * function onError() { index.value += 1 }  // 模板里 :src="candidates[index]"
 * ```
 * @returns 下一个候选；已用尽则返回 null（调用方应改用占位图）
 */
export function nextImageCandidate(
  candidates: string[],
  currentIndex: number,
): string | null {
  const next = currentIndex + 1
  return next < candidates.length ? candidates[next] : null
}
