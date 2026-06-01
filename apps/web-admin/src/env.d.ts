/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_MOCK_AUTH?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'virtual:svg-icons-register' {
  const content: any
  export default content
}
