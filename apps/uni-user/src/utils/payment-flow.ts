/**
 * 支付流程的纯判定逻辑：结果分类、金额校验、轮询节奏。
 *
 * 抽成纯函数是因为这些规则最容易在 UI 里写错又很难测：
 * 「收银台成功其实还没到账」「金额变了要不要拦」「什么时候停止轮询」，
 * 每条判断错了都是钱或用户体验的问题。页面只负责调用和展示。
 */

/** uni.requestPayment 的原始结果 → 业务可读的结果类别。 */
export type PaymentLaunchOutcome = 'launch-success' | 'canceled' | 'failed'

export interface PaymentLaunchResult {
  readonly errMsg?: unknown
}

/**
 * 归类小程序收银台的返回。
 *
 * ⚠️ `launch-success` **不等于付款成功**：它只表示用户在微信弹窗里点了确认，
 * 真正是否到账要由后端查单确认。把它当 PAID 会出现「没到账就清车」。
 */
export function classifyPaymentLaunch(result: PaymentLaunchResult | null | undefined): PaymentLaunchOutcome {
  const errMsg = typeof result?.errMsg === 'string' ? result.errMsg : ''

  if (errMsg.includes('cancel'))
    return 'canceled'

  // 微信成功时 errMsg 形如 "requestPayment:ok"
  if (errMsg === '' || /:ok\b/.test(errMsg) || /:\s*ok$/i.test(errMsg))
    return 'launch-success'

  return 'failed'
}

export interface AmountCheckInput {
  /** 用户在支付页看到的金额（元） */
  readonly shownAmount: number
  /** 服务端建单后返回的应付金额（元） */
  readonly serverAmount: number
}

export type AmountCheckResult = 'match' | 'mismatch' | 'invalid'

/**
 * 比对展示金额与服务端权威金额。
 *
 * 建单后金额可能和页面估价不同（菜品改价、规格变化、配送费变动）。
 * 不一致时必须停下来让用户确认，不能直接按服务端金额扣钱——
 * 用户看到的是 A 价、实际扣 B 价，这在支付里是不可接受的。
 * 用「分」比较，避免 0.1 + 0.2 这类浮点误差误判。
 */
export function checkPayableAmount(input: AmountCheckInput): AmountCheckResult {
  const shown = toMinor(input?.shownAmount)
  const server = toMinor(input?.serverAmount)

  if (shown === null || server === null || server <= 0)
    return 'invalid'

  return shown === server ? 'match' : 'mismatch'
}

function toMinor(value: unknown): number | null {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0)
    return null

  return Math.round(numeric * 100)
}

export const PAYMENT_POLL_INTERVAL_MS = 2500
export const PAYMENT_POLL_MAX_ATTEMPTS = 8

export interface PollDecisionInput {
  /** 已经查询过的次数（含本次） */
  readonly attempts: number
  /** 页面是否还可见（隐藏/卸载后不该继续打接口） */
  readonly active: boolean
}

/**
 * 是否继续轮询。
 *
 * 必须同时看「次数」和「页面是否还在」：
 * - 只看次数：用户切走页面后轮询继续跑，白打接口，回来的迟到响应还会改已离开的页面状态；
 * - 只看 active：用户一直停在页面上时，服务端迟迟不到账会无限轮询。
 */
export function shouldContinuePolling(input: PollDecisionInput): boolean {
  if (!input?.active)
    return false
  const attempts = Number(input.attempts)
  return Number.isFinite(attempts) && attempts < PAYMENT_POLL_MAX_ATTEMPTS
}

/**
 * 结果页拿到订单摘要后，决定该做什么。
 *
 * `'paid'` 才允许清车与写成功上下文；其余状态都要保住恢复信息，
 * 让用户能回来看结果，不能因为一次查询失败就把这笔订单「忘掉」。
 */
export type PaymentSettlementAction = 'paid' | 'keep-polling' | 'closed' | 'needs-resubmit'

export function decideSettlementAction(order: {
  status?: unknown
  paymentChannel?: unknown
} | null | undefined): PaymentSettlementAction {
  const status = String(order?.status ?? '')

  if (status === 'PAID')
    return 'paid'

  if (status === 'PENDING') {
    // 非微信渠道的 PENDING 在小程序端没法付款（支付宝 WAP 打不开），
    // 只能引导用户回商家重新结算，不能一直轮询等一个不会来的结果。
    return String(order?.paymentChannel) === 'WECHAT' ? 'keep-polling' : 'needs-resubmit'
  }

  return 'closed'
}
