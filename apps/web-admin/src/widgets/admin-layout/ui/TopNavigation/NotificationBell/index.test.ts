import type { App, Component, Slot, VNode } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computed,
  createRenderer,
  createSSRApp,
  defineComponent,
  h,
  onMounted,
  ref,
  ssrContextKey,
} from 'vue'
import { renderToString } from 'vue/server-renderer'
import NotificationBell from './index.vue'

interface HostNode {
  type: string
  props: Record<string, unknown>
  children: HostNode[]
  parent: HostNode | null
  text?: string
}

const notificationStore = vi.hoisted(() => ({
  notifications: [],
  unreadCount: 0,
  getByType: vi.fn(() => []),
  unreadByType: vi.fn(() => 0),
  loadNotifications: vi.fn(),
  markAllAsRead: vi.fn(),
  markAsRead: vi.fn(),
  clearAll: vi.fn(),
}))

vi.mock('@/entities/notification', () => ({
  useNotificationStore: () => notificationStore,
}))

function createHostNode(type: string, text?: string): HostNode {
  return {
    type,
    props: {},
    children: [],
    parent: null,
    text,
  }
}

const renderer = createRenderer<HostNode, HostNode>({
  patchProp(node, key, _previousValue, nextValue) {
    node.props[key] = nextValue
  },
  insert(child, parent, anchor) {
    child.parent = parent
    const anchorIndex = anchor ? parent.children.indexOf(anchor) : -1
    if (anchorIndex === -1)
      parent.children.push(child)
    else
      parent.children.splice(anchorIndex, 0, child)
  },
  remove(child) {
    if (!child.parent)
      return
    const index = child.parent.children.indexOf(child)
    if (index !== -1)
      child.parent.children.splice(index, 1)
    child.parent = null
  },
  createElement(type) {
    return createHostNode(type)
  },
  createText(text) {
    return createHostNode('#text', text)
  },
  createComment(text) {
    return createHostNode('#comment', text)
  },
  setText(node, text) {
    node.text = text
  },
  setElementText(node, text) {
    const textNode = createHostNode('#text', text)
    textNode.parent = node
    node.children = [textNode]
  },
  parentNode(node) {
    return node.parent
  },
  nextSibling(node) {
    if (!node.parent)
      return null
    const index = node.parent.children.indexOf(node)
    return node.parent.children[index + 1] ?? null
  },
})

function renderSlots(slots: Record<string, Slot | undefined>): VNode[] {
  return Object.values(slots).flatMap(slot => slot?.() ?? [])
}

const PassThroughStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('pass-through', renderSlots(slots))
  },
})

const EmptyStub = defineComponent({
  props: {
    description: String,
  },
  setup(props) {
    return () => h('empty-state', { description: props.description })
  },
})

function registerElementStubs<THost>(app: App<THost>) {
  const passThroughComponents = [
    'el-popover',
    'el-badge',
    'el-icon',
    'el-button',
    'el-tabs',
    'el-tab-pane',
  ]
  passThroughComponents.forEach(name => app.component(name, PassThroughStub))
  app.component('el-empty', EmptyStub)
}

describe('notification bell', () => {
  let app: ReturnType<typeof renderer.createApp> | undefined

  beforeEach(() => {
    notificationStore.loadNotifications.mockReset()
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('onMounted', onMounted)
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
  })

  afterEach(() => {
    app?.unmount()
    vi.unstubAllGlobals()
  })

  it('renders the empty state without loading notifications on mount', async () => {
    const root = createHostNode('root')
    app = renderer.createApp(NotificationBell as Component)
    app.provide(ssrContextKey, { modules: new Set() })
    registerElementStubs(app)

    app.mount(root)

    expect(notificationStore.loadNotifications).not.toHaveBeenCalled()

    const ssrApp = createSSRApp(NotificationBell as Component)
    registerElementStubs(ssrApp)
    const html = await renderToString(ssrApp)

    expect(html).toContain('description="notification.empty"')
    expect(html).not.toContain('notification-item')
  })
})
