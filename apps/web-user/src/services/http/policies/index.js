// 可选策略插件（显式引入才生效）
// 缓存 / 去重 / 重试已从主链路剔除，留档见 ../extras/optional-policies.js
export { useLocation } from '../request'

export { handleUnauthorized, setUnauthorizedHandler } from './auth'
export { getBusinessMessage, isBusinessError } from './business'
export { resolveUserMessage, showHttpErrorAlert } from './error-message'
export { getMeta } from './meta'
