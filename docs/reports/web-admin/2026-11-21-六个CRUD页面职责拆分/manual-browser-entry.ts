import { createApp, h, shallowRef, nextTick, markRaw } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './src/shared/styles/tokens.scss'
import i18n from './src/shared/i18n'
import request from './src/shared/api/request'

// This throwaway entry replaces every shared request method before pages mount.
// Unknown endpoints fail locally so a missing fixture can never reach the backend.
const sources: Record<string, any> = {
  '/admin/system/roles': [
    { id: 1, name: 'Role A', code: 'role-a', status: 'ACTIVE', remark: 'source remark', permissions: ['page:a', 'button:keep', 'unknown:keep'] },
    { id: 2, name: 'Role B', code: 'role-b', status: 'ACTIVE', remark: '', permissions: ['page:b'] },
  ],
  '/users': [
    { id: 1, username: 'User A', role: 'user', status: 'ACTIVE', email: 'source@example.com', phone: '111', permissions: ['button:keep'], dataScope: 'SHOP', tenant: { id: 11, name: 'Tenant A', code: 'tenant-a' }, boundShopIds: ['21'] },
    { id: 2, username: 'User B', role: 'user', status: 'ACTIVE', email: '', phone: '', permissions: [], dataScope: 'ALL', tenant: null, boundShopIds: [] },
  ],
  '/admin/permissions/buttons': [{ id: 1, name: 'Keep button', code: 'button:keep' }, { id: 2, name: 'Other button', code: 'button:other' }],
  '/admin/tenants': [{ id: 11, name: 'Tenant A', code: 'tenant-a', status: 'ACTIVE' }],
  '/admin/commerce/restaurants': [{ id: 21, name: 'Shop A' }, { id: 22, name: 'Shop B' }],
  '/admin/system/menus': [{ id: 10, parentId: null, title: 'Catalog', path: '/catalog', permission: null, status: 'ACTIVE', type: 'catalog', children: [
    { id: 11, parentId: 10, title: 'Page A', path: 'a', permission: 'page:a', status: 'ACTIVE', type: 'menu' },
    { id: 12, parentId: 10, title: 'Page B', path: 'b', permission: 'page:b', status: 'ACTIVE', type: 'menu' },
    { id: 13, parentId: 10, title: 'Keep button', path: '', permission: 'button:keep', status: 'ACTIVE', type: 'button' },
  ] }],
}
const queues = new Map<string, any[]>()
const calls: any[] = []
const pending = new Map<string, { resolve: Function; reject: Function }>()
function enqueue(method: string, url: string, response: any) {
  const key = `${method}:${url}`
  queues.set(key, [...(queues.get(key) ?? []), response])
}
for (const method of ['get', 'post', 'patch', 'put', 'delete']) {
  ;(request as any)[method] = async (url: string, payload: any) => {
    calls.push({ method, url, payload: structuredClone(payload ?? null), at: performance.now() })
    const response = queues.get(`${method}:${url}`)?.shift()
    if (response?.hold)
      return new Promise((resolve, reject) => pending.set(response.hold, { resolve, reject }))
    if (response?.error)
      throw new Error(response.error)
    if (response?.value !== undefined)
      return structuredClone(response.value)
    if (method === 'get' && sources[url])
      return structuredClone(sources[url])
    if (method !== 'get')
      return { id: 99, ...payload }
    throw new Error(`Unmocked GET ${url}`)
  }
}
const mode = shallowRef('role')
const component = shallowRef<any>(null)
const target = shallowRef<any>(null)
const visible = shallowRef(true)
const initialParentId = shallowRef<number | null>(null)
let saved = 0
const loaders: Record<string, () => Promise<any>> = {
  role: () => import('./src/pages/system/role/index.vue'),
  user: () => import('./src/pages/system/user/index.vue'),
  'role-editor': () => import('./src/pages/system/role/ui/RoleFormDialog.vue'),
  'user-editor': () => import('./src/pages/system/user/ui/UserFormDialog.vue'),
  'role-panel': () => import('./src/pages/system/role/ui/RolePermissionPanel.vue'),
  'tenant-editor': () => import('./src/pages/platform/tenant/ui/TenantFormDialog.vue'),
  'tenant-logs': () => import('./src/pages/platform/tenant/ui/TenantActionLogDialog.vue'),
  'food-editor': () => import('./src/pages/commerce/food/ui/FoodFormDialog.vue'),
  'menu-editor': () => import('./src/pages/system/menu/ui/MenuFormDialog.vue'),
  'dept-editor': () => import('./src/pages/system/dept/ui/DeptFormDialog.vue'),
  'restaurant-editor': () => import('./src/pages/commerce/restaurant/ui/RestaurantFormDialog.vue'),
  tenant: () => import('./src/pages/platform/tenant/index.vue'),
  food: () => import('./src/pages/commerce/food/index.vue'),
  menu: () => import('./src/pages/system/menu/index.vue'),
  dept: () => import('./src/pages/system/dept/index.vue'),
  restaurant: () => import('./src/pages/commerce/restaurant/index.vue'),
}
const app = createApp({ setup() { return () => component.value && h(component.value, mode.value.includes('-') ? {
  role: target.value, user: target.value, tenant: target.value, food: target.value,
  menu: target.value, dept: target.value, restaurant: target.value,
  menus: sources['/admin/system/menus'], depts: sources['/admin/system/depts'] ?? [],
  initialParentId: initialParentId.value, visible: visible.value,
  'onUpdate:visible': (value: boolean) => visible.value = value,
  onSaved: () => saved++,
} : {}) } })
app.use(createPinia()).use(i18n).use(ElementPlus).use(createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { render: () => null } }] }))
app.directive('auth', { mounted() {} })
app.mount('#app')
function find(name: string) {
  const walk = (node: any): any => {
    if (!node) return null
    if (node.component?.type?.name === name || node.component?.type?.__name === name) return node.component
    if (node.component) { const found = walk(node.component.subTree); if (found) return found }
    if (Array.isArray(node.children)) for (const child of node.children) { const found = walk(child); if (found) return found }
    return null
  }
  return walk((app as any)._instance?.subTree)
}
;(window as any).smoke = {
  sources, calls, enqueue, pending, find,
  get state() { return { mode: mode.value, target: target.value, visible: visible.value, saved } },
  async mount(name: string, row: any = null) {
    component.value = null
    await nextTick()
    mode.value = name; target.value = row; visible.value = true; saved = 0; initialParentId.value = null
    component.value = markRaw((await loaders[name]()).default)
    await nextTick()
  },
  async switch(row: any) { target.value = row; await nextTick() },
  async parent(value: number | null) { initialParentId.value = value; await nextTick() },
  async show(value: boolean) { visible.value = value; await nextTick() },
  async resolve(key: string, value: any) { pending.get(key)?.resolve(value); pending.delete(key); await nextTick() },
  async reject(key: string) { pending.get(key)?.reject(new Error('deferred failure')); pending.delete(key); await nextTick() },
}
await (window as any).smoke.mount('role')
