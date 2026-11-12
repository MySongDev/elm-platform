/**
 * 平台适配收口层 —— 支付（议题 6 决策 1 的 L2 接缝）
 *
 * ★ 渠道无关入口。业务代码只调 requestPayment()，不碰渠道细节。
 * 内部按端分支：
 * - 小程序端：微信支付。先由后端可信建单（服务端查价），再拉起微信原生收银台。
 * - H5/App 端：保留既有支付宝 WAP 逻辑（createAlipayWapPayment → 跳转 payUrl）。
 *
 * 两条渠道的机制完全不同，不能互相代替：
 * - 支付宝 WAP 靠整页跳转到网页收银台，只在 H5/App 成立；
 * - 微信小程序里没有 window.location，且支付宝网页在微信里打不开。
 */

import { createAlipayWapPayment, createWechatOrder } from '@/services/api/api-payment'
import { checkPayableAmount } from '@/utils/payment-flow'
import { launchWechatPaymentForOrder } from './wechat-payment'

export interface PaymentRequest {
  /** 已建单则传（继续支付场景）；新支付则传建单所需数据 */
  orderNo?: string
  shopId: string
  shopName: string
  deliveryFee: number
  cartItems: Array<{
    itemId: string
    skuId: string
    title: string
    qty: number
    unitPrice: number
  }>
  /** 已有未消费的结算快照时传，保证重试沿用同一个请求键 */
  requestId?: string
  /** 支付页上展示给用户的金额（元），用于和服务端权威金额比对 */
  shownAmount?: number
  /** 建单成功后回调，调用方据此把 orderNo 绑到快照并保存服务端摘要 */
  onOrderCreated?: (order: WechatCreatedOrder) => void
}

export interface WechatCreatedOrder {
  orderNo: string
  payableAmount?: number
  status?: string
}

export type PaymentOutcome = 'paid-pending' | 'canceled' | 'failed'

export interface PaymentResult {
  success: boolean
  orderNo: string
  /** 收银台走完了但还没确认到账；调用方应跳结果页查单 */
  outcome?: PaymentOutcome
  /** 服务端权威金额（元），UI 应以此展示 */
  payableAmount?: number
  message?: string
}

/**
 * 发起支付。
 *
 * 小程序端流程：可信建单 → 金额核对 → 拉起收银台 → 返回「待确认」让结果页查单。
 * ⚠️ 返回 success 只代表收银台正常走完，**不报到账**：只有结果页查单拿到 PAID 才算付款成功。
 */
export async function requestPayment(req: PaymentRequest): Promise<PaymentResult> {
  // #ifdef MP-WEIXIN
  try {
    // 续付：订单已建好，只重新拉收银台，绝不重复建单。
    if (req.orderNo) {
      const launch = await launchWechatPaymentForOrder(req.orderNo)
      return toWechatResult(req.orderNo, launch)
    }

    const requestId = String(req.requestId ?? '')
    if (!requestId) {
      return {
        success: false,
        orderNo: '',
        message: '结算已失效，请返回重新结算',
      }
    }

    const order = await createWechatOrder({
      requestId,
      shopId: String(req.shopId),
      cartItems: req.cartItems.map(item => ({
        itemId: String(item.itemId),
        skuId: String(item.skuId),
        qty: item.qty,
      })),
    })
    if (!order?.orderNo) {
      return {
        success: false,
        orderNo: '',
        message: '建单失败，请稍后重试',
      }
    }

    // 建单先把单号交给调用方落盘：即使下一步失败，用户也能回订单列表续付。
    req.onOrderCreated?.({
      orderNo: order.orderNo,
      payableAmount: Number(order.payableAmount),
      status: order.status,
    })

    // 服务端按当前菜单重新算过价，和页面展示不一致时必须先停下来确认。
    if (req.shownAmount !== undefined) {
      const check = checkPayableAmount({
        shownAmount: req.shownAmount,
        serverAmount: Number(order.payableAmount),
      })
      if (check === 'mismatch') {
        return {
          success: false,
          orderNo: order.orderNo,
          payableAmount: Number(order.payableAmount),
          message: '价格已更新，请确认后重新支付',
        }
      }
      if (check === 'invalid') {
        return {
          success: false,
          orderNo: order.orderNo,
          message: '订单金额异常，请联系客服',
        }
      }
    }

    const launch = await launchWechatPaymentForOrder(order.orderNo)
    return toWechatResult(order.orderNo, launch, Number(order.payableAmount))
  }
  catch (error) {
    return {
      success: false,
      orderNo: req.orderNo ?? '',
      message: error instanceof Error ? error.message : '发起支付失败',
    }
  }
  // #endif

  // #ifndef MP-WEIXIN
  // H5 / App 端：现有支付宝 WAP 逻辑。
  // ⚠️ 支付宝靠整页跳转到收银台（window.location.href = payUrl），
  // 这套机制只在 H5/App 成立。
  try {
    const data = await createAlipayWapPayment({
      shopId: req.shopId,
      shopName: req.shopName,
      deliveryFee: req.deliveryFee,
      cartItems: req.cartItems,
    })

    if (data?.payUrl) {
      // H5 端跳转。App 端需要另外的处理（plus.runtime.openURL 等），第二批再定。
      window.location.href = data.payUrl
      return {
        success: true,
        orderNo: data.orderNo ?? '',
      }
    }

    return {
      success: false,
      orderNo: data?.orderNo ?? '',
      message: data?.message || '支付链接获取失败',
    }
  }
  catch (error) {
    return {
      success: false,
      orderNo: req.orderNo ?? '',
      message: error instanceof Error ? error.message : '支付失败',
    }
  }
  // #endif
}

/** 收银台结果 → 统一返回。取消单独标出来，避免被当成错误弹提示或触发重试。 */
function toWechatResult(
  orderNo: string,
  launch: {
    launched: boolean
    canceled: boolean
    message?: string
  },
  payableAmount?: number,
): PaymentResult {
  if (launch.launched) {
    return {
      success: true,
      orderNo,
      outcome: 'paid-pending',
      payableAmount,
    }
  }

  if (launch.canceled) {
    return {
      success: false,
      orderNo,
      outcome: 'canceled',
      payableAmount,
    }
  }

  return {
    success: false,
    orderNo,
    outcome: 'failed',
    payableAmount,
    message: launch.message || '支付未完成',
  }
}
