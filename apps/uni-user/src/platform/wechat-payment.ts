/**
 * 平台适配收口层 —— 微信小程序支付。
 *
 * 只做「本端怎么把收银台拉起来」这一件事：换 code、取预支付参数、调 uni.requestPayment。
 * 建什么单、扣多少钱、到没到账都由后端决定，本文件不做任何金额计算，
 * 也不把收银台返回值当成付款成功（那只是用户在弹窗里点了确认）。
 *
 * 与支付宝分支的区别：支付宝靠整页跳转到网页收银台，这套机制在微信小程序里不存在；
 * 小程序必须走微信原生支付弹窗，且订单号必须是后端用商户号下过预支付单的那个。
 */

import { resumeWechatPayment } from '@/services/api/api-payment'
import { classifyPaymentLaunch } from '@/utils/payment-flow'

export interface WechatPaymentParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA'
  paySign: string
}

export interface WechatLaunchResult {
  /** 收银台是否正常走完（true 也不代表已到账，要到账确认看后端查单） */
  launched: boolean
  /** 用户主动取消：不该提示为错误，也不该重复建单 */
  canceled: boolean
  message?: string
}

/**
 * 微信登录 code：只在服务端换 openid，前端不保存。
 * 失败返回 null，调用方给出可读提示而不是拿空 code 去请求。
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

/** 拉起微信收银台。参数必须来自后端 resume 接口，本端不拼装、不修改。 */
export function invokeWechatPayment(params: WechatPaymentParams): Promise<WechatLaunchResult> {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      // uni 的字段名是 package，与微信原始参数字段同名
      package: params.package,
      signType: params.signType,
      paySign: params.paySign,
      success: result => resolve({
        launched: classifyPaymentLaunch(result) === 'launch-success',
        canceled: false,
      }),
      fail: (error) => {
        const outcome = classifyPaymentLaunch(error)
        resolve({
          launched: false,
          canceled: outcome === 'canceled',
          message: outcome === 'canceled' ? undefined : (typeof error?.errMsg === 'string' ? error.errMsg : '支付未完成'),
        })
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    // 支付宝/H5 的收银台是网页跳转，不能走这里；App 端未实现，不冒充已支持。
    void params
    resolve({
      launched: false,
      canceled: false,
      message: '当前端暂不支持微信小程序支付',
    })
    // #endif
  })
}

/**
 * 为已建订单拉起微信支付：换 code → 后端取预支付参数 → 原生弹窗。
 *
 * 续付与首次支付共用：只要订单是 PENDING 且渠道是微信，就能重新取参数拉起。
 * 已支付的订单后端会拒绝，所以这里不需要（也无法）在前端判断到账。
 */
export async function launchWechatPaymentForOrder(orderNo: string): Promise<WechatLaunchResult> {
  if (!orderNo) {
    return {
      launched: false,
      canceled: false,
      message: '缺少订单号',
    }
  }

  const code = await getWxLoginCode()
  if (!code) {
    return {
      launched: false,
      canceled: false,
      message: '获取微信登录凭证失败，请重试',
    }
  }

  const result = await resumeWechatPayment({
    orderNo,
    code,
  })
  const params = result?.paymentParams

  if (!params?.paySign || !params?.package) {
    return {
      launched: false,
      canceled: false,
      message: '获取支付参数失败，请稍后重试',
    }
  }

  return invokeWechatPayment(params)
}
