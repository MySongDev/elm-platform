export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const ELM_ASSET_HOST = import.meta.env.VITE_ELM_ASSET_HOST || 'https://elm.cangdu.org'

export const IMAGE_BASE_URL = `${ELM_ASSET_HOST}/img/`

export const DEFAULT_RESTAURANT_IMAGE = `${IMAGE_BASE_URL}187bcca1ec6114376.jpg`

export function getImageUrl(path = '') {
  if (!path)
    return DEFAULT_RESTAURANT_IMAGE

  if (/^https?:\/\//.test(path))
    return path

  return `${IMAGE_BASE_URL}${String(path).replace(/^\/+/, '')}`
}
