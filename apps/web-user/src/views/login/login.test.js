import { createApp, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Login from './login.vue'

const push = vi.fn()
const recordUserInfo = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { redirect: '/orders' } }),
  useRouter: () => ({ push }),
}))

vi.mock('@/components/common/AlterTip/index', () => ({
  showAlert: vi.fn(),
}))

vi.mock('@/stores/modules/store-user', () => ({
  useUserStore: () => ({ recordUserInfo }),
}))

vi.mock('@/services/api/', () => ({
  accountLogin: vi.fn(),
  getCaptchas: vi.fn(() => Promise.resolve('captcha')),
  customerPasswordLogin: vi.fn(() => Promise.resolve({ token: 'password-token', user: { id: 1, phone: '13800138000' } })),
  customerRegister: vi.fn(() => Promise.resolve({ token: 'register-token', user: { id: 2, phone: '13800138001' } })),
  customerSmsLogin: vi.fn(() => Promise.resolve({ token: 'sms-token', user: { id: 3, phone: '13800138002' } })),
  sendCustomerSms: vi.fn(() => Promise.resolve({ debugCode: '123456' })),
}))

async function mountLogin() {
  const root = document.createElement('div')
  document.body.appendChild(root)

  const app = createApp(Login)
  app.component('head-top', { template: '<header />' })
  app.component('router-link', {
    props: ['to'],
    template: '<a><slot /></a>',
  })
  app.mount(root)
  await nextTick()

  return {
    root,
    unmount: () => {
      app.unmount()
      root.remove()
    },
  }
}

function inputByPlaceholder(root, placeholder) {
  return root.querySelector(`input[placeholder="${placeholder}"]`)
}

async function setInput(input, value) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

function buttonByText(root, text) {
  return Array.from(root.querySelectorAll('button')).find(button => button.textContent.includes(text))
}

function submitButton(root) {
  return root.querySelector('.login_container')
}

describe('Login view', () => {
  let wrapper
  let api

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    api = await import('@/services/api/')
    wrapper = await mountLogin()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('sends login SMS codes from the default tab', async () => {
    await setInput(inputByPlaceholder(wrapper.root, '手机号'), '13800138000')

    buttonByText(wrapper.root, '获取验证码').click()
    await nextTick()

    expect(api.sendCustomerSms).toHaveBeenCalledWith('13800138000', 'login')
  })

  it('logs in with phone and password then follows redirect', async () => {
    buttonByText(wrapper.root, '密码登录').click()
    await nextTick()

    await setInput(inputByPlaceholder(wrapper.root, '手机号'), '13800138000')
    await setInput(inputByPlaceholder(wrapper.root, '请输入密码'), 'secret123')

    submitButton(wrapper.root).click()
    await nextTick()

    expect(api.customerPasswordLogin).toHaveBeenCalledWith('13800138000', 'secret123')
    expect(recordUserInfo).toHaveBeenCalledWith({ token: 'password-token', user: { id: 1, phone: '13800138000' } })
    expect(push).toHaveBeenCalledWith('/orders')
  })

  it('registers with phone, SMS code, and optional password', async () => {
    buttonByText(wrapper.root, '注册').click()
    await nextTick()

    await setInput(inputByPlaceholder(wrapper.root, '手机号'), '13800138001')
    await setInput(inputByPlaceholder(wrapper.root, '短信验证码'), '123456')
    await setInput(inputByPlaceholder(wrapper.root, '设置密码（可选）'), 'secret123')

    submitButton(wrapper.root).click()
    await nextTick()

    expect(api.customerRegister).toHaveBeenCalledWith('13800138001', '123456', 'secret123')
    expect(recordUserInfo).toHaveBeenCalledWith({ token: 'register-token', user: { id: 2, phone: '13800138001' } })
    expect(push).toHaveBeenCalledWith('/orders')
  })
})
