export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const ELM_ASSET_HOST = import.meta.env.VITE_ELM_ASSET_HOST || 'https://elm.cangdu.org'

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
