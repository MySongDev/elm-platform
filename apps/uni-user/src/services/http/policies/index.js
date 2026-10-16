// ⚠️ 与 apps/web-user/src/services/http/policies/index.js 同源，但已分叉，修改需自行判断是否要同步。
// 差异：web-user 已于 2026-10-02 把 cache/dedupe/retry 从主链路剔除
// （无调用方，留档见 web-user 的 ../extras/optional-policies.js 与 docs/engineering/010-http-optional-policies.md），
// 只保留 useLocation 从 ../request 导出；uni-user 这边三段策略仍在，且是按小程序平台
// 适配过的版本（错误判定看 TransportError、定位异步、去重依赖入口的 AbortController 垫片），
// 因此这里继续从 request.js 全量导出。

export { clearHttpCache, useCache, useDedupe, useLocation, useRetry } from '../request'

export { handleUnauthorized, setUnauthorizedHandler } from './auth'
export { getBusinessMessage, isBusinessError } from './business'
export { resolveUserMessage, setAlertHandler, showHttpErrorAlert } from './error-message'
export { getMeta, stableStringify } from './meta'
