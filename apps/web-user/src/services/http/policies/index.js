// 可选策略插件（显式引入才生效）
export { clearHttpCache, useCache } from '../request'
export { useDedupe } from '../request'
export { useRetry } from '../request'
export { useLocation } from '../request'

export { handleUnauthorized, setUnauthorizedHandler } from './auth'
export { getBusinessMessage, isBusinessError } from './business'
export { resolveUserMessage, showHttpErrorAlert } from './error-message'
export { getMeta, stableStringify } from './meta'
