// ⚠️ 与 apps/web-user/src/stores/index.js 同源（9 行结构保持纯净）。
// 迁移方案议题 1 决策：不引入 pinia-plugin-persistedstate，
// 故 web-user main.js:39 的 `pinia.use(piniaPersist)` 在本端**直接删掉**，
// 持久化职责下沉到各 store（store-cart 改手动 watch，其余本就手动）。

import { createPinia } from 'pinia'

const pinia = createPinia()

export { pinia }

export function registStore(app) {
  app.use(pinia)
}
