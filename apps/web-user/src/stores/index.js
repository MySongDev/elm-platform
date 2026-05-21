import { createPinia } from 'pinia'

const pinia = createPinia()

export { pinia }

export function registStore(app) {
  app.use(pinia)
}
