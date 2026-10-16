/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ELM_ASSET_HOST?: string
  readonly VITE_API_HOST_OVERRIDE?: string
  /** 开发期兜底坐标，格式 `纬度,经度`。仅 DEV 生效，见 config/index.ts */
  readonly VITE_DEV_FALLBACK_LOCATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}
