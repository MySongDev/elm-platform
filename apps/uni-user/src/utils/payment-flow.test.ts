import { describe, expect, it } from 'vitest'

import {
  checkPayableAmount,
  classifyPaymentLaunch,
  decideSettlementAction,
  PAYMENT_POLL_MAX_ATTEMPTS,
  shouldContinuePolling,
} from './payment-flow'

describe('classifyPaymentLaunch', () => {
  it('用户取消归类为 canceled，不当成错误', () => {
    expect(classifyPaymentLaunch({ errMsg: 'requestPayment:fail cancel' })).toBe('canceled')
  })

  it('收银台走完归类为 launch-success', () => {
    expect(classifyPaymentLaunch({ errMsg: 'requestPayment:ok' })).toBe('launch-success')
  })

  it('其他失败归类为 failed', () => {
    expect(classifyPaymentLaunch({ errMsg: 'requestPayment:fail system error' })).toBe('failed')
  })

  it('缺省 errMsg 视为走完，交给后端查单确认', () => {
    expect(classifyPaymentLaunch({})).toBe('launch-success')
    expect(classifyPaymentLaunch(null)).toBe('launch-success')
  })

  it('fail 里带 canceled 字样不会被误判为成功', () => {
    expect(classifyPaymentLaunch({ errMsg: 'requestPayment:fail canceled by user' })).toBe('canceled')
  })
})

describe('checkPayableAmount', () => {
  it('金额一致返回 match', () => {
    expect(checkPayableAmount({
      shownAmount: 29,
      serverAmount: 29,
    })).toBe('match')
  })

  it('金额不同返回 mismatch，绝不按服务端价格静默扣款', () => {
    expect(checkPayableAmount({
      shownAmount: 29,
      serverAmount: 35,
    })).toBe('mismatch')
  })

  it('浮点误差不误判为 mismatch', () => {
    expect(checkPayableAmount({
      shownAmount: 0.1 + 0.2,
      serverAmount: 0.3,
    })).toBe('match')
    expect(checkPayableAmount({
      shownAmount: 19.99,
      serverAmount: 19.99,
    })).toBe('match')
  })

  it('服务端金额为 0 或非法返回 invalid', () => {
    expect(checkPayableAmount({
      shownAmount: 10,
      serverAmount: 0,
    })).toBe('invalid')
    expect(checkPayableAmount({
      shownAmount: 10,
      serverAmount: Number.NaN,
    })).toBe('invalid')
  })
})

describe('shouldContinuePolling', () => {
  it('页面还在且未达上限时继续', () => {
    expect(shouldContinuePolling({
      attempts: 1,
      active: true,
    })).toBe(true)
  })

  it('页面隐藏后立即停止', () => {
    expect(shouldContinuePolling({
      attempts: 1,
      active: false,
    })).toBe(false)
  })

  it('达到上限后停止，不会无限轮询', () => {
    expect(shouldContinuePolling({
      attempts: PAYMENT_POLL_MAX_ATTEMPTS,
      active: true,
    })).toBe(false)
  })
})

describe('decideSettlementAction', () => {
  it('只有 PAID 才允许清车', () => {
    expect(decideSettlementAction({
      status: 'PAID',
      paymentChannel: 'WECHAT',
    })).toBe('paid')
  })

  it('微信 PENDING 保持轮询', () => {
    expect(decideSettlementAction({
      status: 'PENDING',
      paymentChannel: 'WECHAT',
    })).toBe('keep-polling')
  })

  it('非微信渠道的 PENDING 引导重新结算，不无限等', () => {
    expect(decideSettlementAction({
      status: 'PENDING',
      paymentChannel: null,
    })).toBe('needs-resubmit')
  })

  it('已关闭订单归类为 closed', () => {
    expect(decideSettlementAction({
      status: 'CLOSED',
      paymentChannel: 'WECHAT',
    })).toBe('closed')
  })

  it('缺数据时不当作已支付', () => {
    expect(decideSettlementAction(null)).toBe('closed')
  })
})
