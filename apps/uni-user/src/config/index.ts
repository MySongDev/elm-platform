/**
 * 全局配置 —— 域名一键切换的唯一入口
 *
 * ⚠️ 小程序端没有 vite proxy：请求直接发出，不经过 dev server。
 * ⚠️ import.meta.env 在 uni-app 小程序构建下只做构建期静态替换，
 *    运行时读 process.env 拿不到 → 这里显式按环境分支，便于排查。
 *
 * 上线时只改 VITE_API_BASE_URL（备案域名就绪后），图片域名自动跟随，
 * 因为 ELM_ASSET_HOST 默认值就是 API_BASE_URL（迁移方案议题 2）。
 */

/** 开发期连本地后端；真机预览时 127.0.0.1 不可达，用 VITE_API_HOST_OVERRIDE 换成局域网 IP */
const DEFAULT_DEV_BASE_URL = 'http://127.0.0.1:3000/api'
const DEFAULT_PROD_BASE_URL = 'https://elm-platform.onrender.com/api'

// ⚠️ 用 import.meta.env.PROD 而非 process.env.NODE_ENV：
// 前者是 Vite 的标准语义且构建期静态替换（Batch 0 实测产物里确认有 `PROD:!0`、
// `MODE:"production"`）；后者在小程序端拿不到 process 全局对象，还会让 vue-tsc
// 报 TS2591（找不到 process 类型）。
const isProd = Boolean(import.meta.env.PROD)

/** 真机预览覆盖项（手机上的 localhost 指向手机自己） */
const hostOverride = import.meta.env.VITE_API_HOST_OVERRIDE || ''

export const API_BASE_URL
  = hostOverride
    || import.meta.env.VITE_API_BASE_URL
    || (isProd ? DEFAULT_PROD_BASE_URL : DEFAULT_DEV_BASE_URL)

/**
 * 图片资源主机。
 * ⚠️ 不再直连第三方域名 elm.cangdu.org（无法 ICP 备案，小程序白名单不放行），
 * 改为走自己后端的图片代理端点，默认跟随 API_BASE_URL。
 */
export const ELM_ASSET_HOST = import.meta.env.VITE_ELM_ASSET_HOST || API_BASE_URL

/** 图片代理前缀。对应后端 GET /api/img/*（长期契约，迁移方案议题 2） */
export const IMAGE_BASE_URL = `${ELM_ASSET_HOST}/img/`

/** 请求超时（毫秒） */
export const REQUEST_TIMEOUT = 10000

/**
 * 开发期兜底坐标（定位失败时用）。⚠️ 生产构建恒为 null。
 *
 * 存在原因见 platform/location.ts 的 getLocationWithTimeout 文档（2026-09-29 实测）：
 * 游客模式（无真实 appid）下 wx.getLocation 必然 fail，坐标恒为 null，
 * 商家接口会因缺 latitude/longitude 被后端拒掉 → 列表恒空且静默。
 *
 * 格式：`纬度,经度`（逗号分隔）。默认值取后端 seed 数据所在城市（广州），
 * 这样兜底坐标能真的查到商家，而不是查到一个空列表。
 *
 * ⚠️ 生产门控刻意放在**这里**而非调用方，且**直接内联 `import.meta.env.PROD`
 * 而不用上面的 `isProd` 变量**：`isProd` 是 `Boolean(import.meta.env.PROD)`，
 * 那层 `Boolean()` 包装会**阻止 minifier 的常量折叠**（实测：生产包里
 * `if(e)return null` 的 else 分支连同坐标字符串一起残留）。内联后构建期直接
 * 替换成 `!0` → 折叠为 `if(true)` → 死代码消除 → 坐标字符串在生产包里**物理不存在**。
 */
export const DEV_FALLBACK_LOCATION: {
  latitude: number
  longitude: number
} | null = (() => {
  if (import.meta.env.PROD) {
    return null
  }

  const raw = import.meta.env.VITE_DEV_FALLBACK_LOCATION ?? '23.1291,113.2644'
  const [lat, lng] = raw.split(',').map(part => Number.parseFloat(part.trim()))

  // ⚠️ 用 Number.isFinite 而非真值判断：0 是合法坐标（赤道/本初子午线），
  // 真值判断会把它误判成「没配置」；这里只拦 NaN / Infinity。
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    latitude: lat,
    longitude: lng,
  }
})()

/**
 * 图片并发基础值。
 * ⚠️ 微信小程序 wx.request 并发上限 10，图片请求也占额度 → 6 是安全值。
 * 与 web-user 的 IMAGE_LOAD_BASE_CONCURRENCY 默认值一致（它可被 env 覆盖，本端不需要）。
 */
export const IMAGE_LOAD_BASE_CONCURRENCY = 6

/** 占位图（后端代理不可用时的兜底） */
export const DEFAULT_RESTAURANT_IMAGE = `${IMAGE_BASE_URL}187bcca1ec6114376.jpg`

/** 上传资源前缀，指向自己后端（main.ts 的 useStaticAssets），备案域名下可用 */
export const UPLOAD_BASE_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/uploads/`

/**
 * 拼接图片完整 URL。⚠️ 上游路径形态不一致，有的带前导斜杠有的不带，必须归一化。
 *
 * ⚠️ **协议判定见 `isUnusableImagePath`**：`blob:` / `http://localhost` 这类
 * 「只在原浏览器会话里有效」的地址**必须**当作无图处理（见其注释），
 * 不能进 `IMAGE_BASE_URL` 拼接，也不能原样透传。
 */
export function getImageUrl(path?: string | null): string {
  if (!path || isUnusableImagePath(path)) {
    return DEFAULT_RESTAURANT_IMAGE
  }
  // data: URI 原样返回（内联图，不涉网络与域名白名单）
  if (path.startsWith('data:')) {
    return path
  }
  // 相对协议 `//host/x.jpg` 仍是外域，小程序白名单不放行 → 也走占位图
  if (/^\/\//.test(path)) {
    return DEFAULT_RESTAURANT_IMAGE
  }
  // ⚠️ 绝对 http(s) 不再原样透传：小程序端只有自己后端在白名单里，
  // 透传外域必然加载失败（还会白占一次请求）。统一收敛到后端代理。
  if (/^https?:\/\//i.test(path)) {
    return DEFAULT_RESTAURANT_IMAGE
  }
  return `${IMAGE_BASE_URL}${path.replace(/^\/+/, '')}`
}

/**
 * 判定「这条 image_path 在小程序端不可能加载成功」。
 *
 * 来源是上游 seed 数据的脏值（2026-10-19 实测 `restaurant_id=1` 的菜单里 50 条）：
 * - `blob:http://localhost:8002/xxx` / `blob:http://localhost:8080/xxx`
 *   —— `blob:` 是**浏览器会话内的临时对象 URL**，离开那个页面就永久失效，
 *     任何端都取不到；它连「外域」都算不上，是死链。
 * - `http://localhost:...` —— 指向开发机自己，小程序端必然失败（且不在白名单）。
 *
 * 为什么必须显式判掉而不是「让它请求失败再回退」：SmartImage 没有失败回退
 * （2026-11-06 删掉了候选 origin 回退，它的列表本来就为空），失败后只会显示
 * 「加载失败」，不会自动换占位图 —— 用户看到的是破图而非占位图。
 */
export function isUnusableImagePath(path: string): boolean {
  const lower = path.toLowerCase()
  // 协议相对 / 绝对协议 一律交回 getImageUrl 走占位图分支
  if (lower.startsWith('blob:') || lower.startsWith('filesystem:')) {
    return true
  }
  // 上游把 null 序列化成了字符串字面量（形如 "null" / "undefined"）→ 当无图
  if (lower === 'null' || lower === 'undefined') {
    return true
  }
  // 指向本机的绝对地址（含 127.0.0.1 / ::1 / localhost 及常见 dev 端口）
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i.test(path)) {
    return true
  }
  return false
}

/** 拼接上传资源完整 URL */
export function getUploadUrl(path?: string | null): string {
  if (!path) {
    return ''
  }
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith('data:')) {
    return path
  }
  return `${UPLOAD_BASE_URL}${path.replace(/^\/+/, '')}`
}
