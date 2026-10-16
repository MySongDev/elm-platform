/**
 * 平台适配收口层 —— 支付（议题 6 决策 1 的 L2 接缝）
 *
 * ★ 渠道无关入口。业务代码只调 requestPayment()，不碰任何渠道细节。
 * 内部按端分支：
 * - 小程序端：**返回「当前端暂不支持支付」**（留桩）。
 *   ⚠️ 不是「改个跳转方式」就能支持 —— 微信小程序支付是完全不同的协议：
 *   后端签名 → uni.requestPayment({ timeStamp, nonceStr, package, signType, paySign })
 *   五参数 → 微信原生弹窗 → 同步回调。且需要**商户号资质**，契约细节
 *   （如 prepay_id 格式）取决于实际申请下来的配置，现在定可能白定（方案议题 6）。
 * - H5/App 端：保留现有支付宝 WAP 逻辑（createAlipayWapPayment → 跳转 payUrl）。
 *   ⚠️ 当前只做小程序端，H5 分支留 TODO（第二批启用 uni-h5 时接）。
 *
 * 将来后端加微信支付通道后，**只需在本文件补一个分支**，调用方零改动。
 * 这就是 L2（而非 L1 最浅桩）的价值：L1 把「端无关的接口抽象」也省了，
 * 将来接微信支付时还要再动一次 api-payment.js。
 */

import { createAlipayWapPayment } from '@/services/api/api-payment'

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
}

export interface PaymentResult {
  success: boolean
  orderNo: string
  message?: string
}

/**
 * 发起支付。
 *
 * ⚠️ 小程序端当前**永远返回 success: false**（留桩），但**建单已在后端独立完成**
 * （Batch 1 第 11 项拆出的独立建单端点）→ order 页能产生 PENDING 订单、
 * 能用真实数据验收，只是「完成支付」这一步不支持。
 * 这个预期必须清楚：不是「下单也做不到」，是「下单可以、付款不行」。
 */
export async function requestPayment(req: PaymentRequest): Promise<PaymentResult> {
  // #ifdef MP-WEIXIN
  // 小程序端：留桩。将来接微信支付时在这里调后端 wechat/create → uni.requestPayment
  void req
  return {
    success: false,
    orderNo: req.orderNo ?? '',
    message: '当前端暂不支持支付',
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

/**
 * 微信登录 code 接缝（预留，本次不实现）。
 *
 * ⚠️ 全库 grep code2session/jscode2session/openid/wechat 零命中 ——
 * 后端**没有**微信小程序登录通道。短信登录链路是完整的
 * （customer-auth 的 login/sms + SmsVerification.vue），可以撑着用，
 * 微信一键登录不再是阻塞项（议题 6 修正 2）。
 *
 * 将来实现：uni.login() 拿 code → 后端 POST /customer-auth/login/wechat
 * （code2session 换 openid → 建/取用户 → 发令牌）。
 */
export function getWxLoginCode(): Promise<string | null> {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.login({
      provider: 'weixin',
      success: result => resolve(result.code || null),
      fail: () => resolve(null),
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve(null)
    // #endif
  })
}
