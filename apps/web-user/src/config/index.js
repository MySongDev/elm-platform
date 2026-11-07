export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 图片资源默认走**自身后端**（011 商家图片本地化收口）：
 * - 商家图 / 菜品图：`${API_BASE_URL}/img/<path>`，由后端从本地资产目录读取
 * - 首页分类图：`${API_BASE_URL}/img/cdn/<path>`（见 msite.vue）
 * 开发期 Vite 把 /api 代理到 127.0.0.1:3000；生产由部署侧提供 /api。
 * 仍可显式设置 VITE_ELM_ASSET_HOST 指向其它源（会覆盖本地默认值，部署验收需留意）。
 */
export const ELM_ASSET_HOST = import.meta.env.VITE_ELM_ASSET_HOST || API_BASE_URL

export const IMAGE_BASE_URL = `${ELM_ASSET_HOST}/img/`

// 用户自己上传的文件（头像等）存在后端，数据库里只存相对路径，这里拼成可访问的地址。
// 已经是绝对地址的（例如以后换成对象存储的 URL）直接返回，不再拼接。
export const UPLOAD_BASE_URL = `${API_BASE_URL}/uploads/`

export function getUploadUrl(path = '') {
  if (!path)
    return ''

  if (/^https?:\/\//.test(path))
    return path

  return `${UPLOAD_BASE_URL}${String(path).replace(/^\/+/, '')}`
}

export const DEFAULT_RESTAURANT_IMAGE = `${IMAGE_BASE_URL}187bcca1ec6114376.jpg`

export function getImageUrl(path = '') {
  if (!path)
    return DEFAULT_RESTAURANT_IMAGE

  if (/^https?:\/\//.test(path))
    return path

  return `${IMAGE_BASE_URL}${String(path).replace(/^\/+/, '')}`
}
