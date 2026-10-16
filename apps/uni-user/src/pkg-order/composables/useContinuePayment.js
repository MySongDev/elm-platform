// ⚠️ 与 apps/web-user/src/views/order/composables/useContinuePayment.js 同源改造。
// 修改需同步两处。
//
// ★ 与 web-user 的差异（平台强制，非风格）：
// 1. **跳转支付**：web-user 的 `defaultRedirectToPayUrl` 是 `window.location.href = payUrl`
//    （支付宝 H5 收银台整页跳转），小程序端**没有 window.location**，
//    且支付宝 WAP 在微信小程序里打不开。改走 platform/payment 的 `requestPayment`
//    渠道无关入口（见 platform/payment.ts：小程序端当前返回「暂不支持支付」的留桩，
//    将来接微信支付时调用方零改动）。
// 2. **续付语义**：web-user 用 `resumeAlipayWapPayment` 拿 payUrl 再跳；
//    uni-user 改用 `requestPayment({ orderNo })` 的续付通道（传已建单号）。
//    状态预检（PAID/CLOSED/PENDING 判定）逻辑与 web-user 逐行一致。
// 3. `showAlert`（AlterTip 命令式 DOM）→ platform/feedback 的 showToast
import { readonly, shallowRef, toValue } from 'vue'

import { showToast } from '@/platform/feedback'
import { requestPayment } from '@/platform/payment'
import { getAlipayPaymentStatus } from '@/services/api/api-payment'

export function useContinuePayment({
  isLoggedIn,
  fetchOrders,
  goLogin,
}) {
  const continuingOrderNo = shallowRef('')

  async function refreshOrders() {
    await fetchOrders?.()
  }

  async function continuePayment(order) {
    if (!toValue(isLoggedIn)) {
      goLogin()
      return
    }

    if (!order?.orderNo || continuingOrderNo.value)
      return

    continuingOrderNo.value = order.orderNo

    try {
      const latest = await getAlipayPaymentStatus(order.orderNo, true)

      if (latest?.status === 'PAID') {
        showToast('订单已支付')
        await refreshOrders()
        return
      }

      if (latest?.status === 'CLOSED') {
        showToast('订单已关闭，请重新下单')
        await refreshOrders()
        return
      }

      if (latest?.status !== 'PENDING') {
        showToast('当前订单状态不可继续支付')
        await refreshOrders()
        return
      }

      // 小程序端走渠道无关的续付接缝（当前留桩返回「暂不支持」，
      // 将来接微信支付时在此处真正拉起支付）
      const result = await requestPayment({ orderNo: order.orderNo })

      if (result.success)
        await refreshOrders()
      else
        showToast(result.message || '继续支付失败，请稍后再试')
    }
    catch (err) {
      showToast(err?.message || '继续支付失败，请稍后再试')
    }
    finally {
      continuingOrderNo.value = ''
    }
  }

  return {
    continuingOrderNo: readonly(continuingOrderNo),
    continuePayment,
  }
}
