/**
 * 平台适配收口层 —— 图片 URL 构建
 *
 * 2026-11-06：删掉了候选 origin 回退（parseOrigin / parsePathAndQuery /
 * buildImageCandidateUrls / nextImageCandidate）。回退列表默认为空，图片全部走自身后端，
 * 这套逻辑从未真正生效；SmartImage 也不再调用。与 web-user 删除 imageCandidates.js 同步。
 */

import {
  API_BASE_URL,
  getImageUrl as buildImageUrl,
  getUploadUrl as buildUploadUrl,
  DEFAULT_RESTAURANT_IMAGE,
} from '@/config'

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
