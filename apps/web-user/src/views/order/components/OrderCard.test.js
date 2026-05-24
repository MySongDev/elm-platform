import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import OrderCard from './OrderCard.vue'

function createOrder(overrides = {}) {
  return {
    orderNo: 'ELMALI202605241200000001',
    shopName: '示例商家',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
    payableAmount: 29,
    totalQty: 2,
    createdAt: '2026-05-24T12:00:00.000Z',
    updatedAt: '2026-05-24T12:00:00.000Z',
    paidAt: null,
    ...overrides,
  }
}

async function mountOrderCard(props, listeners = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)

  const app = createApp(OrderCard, { ...props, ...listeners })
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

describe('orderCard', () => {
  it('shows continue payment action for pending orders', async () => {
    const wrapper = await mountOrderCard({
      order: createOrder(),
    })

    expect(wrapper.root.textContent).toContain('继续支付')

    wrapper.unmount()
  })

  it('emits continue-payment when clicking pending order action', async () => {
    const order = createOrder()
    const emitted = []
    const wrapper = await mountOrderCard(
      { order },
      {
        onContinuePayment: payload => emitted.push(payload),
      },
    )

    wrapper.root.querySelector('[data-test="continue-payment"]').click()
    await nextTick()

    expect(emitted).toEqual([order])

    wrapper.unmount()
  })

  it('does not show continue payment action for paid orders', async () => {
    const wrapper = await mountOrderCard({
      order: createOrder({ status: 'PAID' }),
    })

    expect(wrapper.root.textContent).not.toContain('继续支付')

    wrapper.unmount()
  })
})
