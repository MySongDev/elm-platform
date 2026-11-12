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

import { withQuery } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { navigateTo, ROUTES } from '@/platform/navigation'
import { requestPayment } from '@/platform/payment'
import { getPaymentStatusByChannel } from '@/services/api/api-payment'
import { useCartStore } from '@/stores/modules/store-cart'
import { useUserStore } from '@/stores/modules/store-user'

export function useContinuePayment({
  isLoggedIn,
  fetchOrders,
  goLogin,
}) {
  const continuingOrderNo = shallowRef('')
  const cartStore = useCartStore()
  const userStore = useUserStore()

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
      // 按订单渠道查单：微信单查支付宝只会一直回「未支付」。
      const latest = await getPaymentStatusByChannel(order.orderNo, order.paymentChannel, true)

      if (latest?.status === 'PAID') {
        showToast('订单已支付')
        await refreshOrders()
        return
      }

      if (latest?.status === 'CLOSED') {
        // 不结束旧快照的话，回到结算页会复用已关闭单的 requestId 又被后端判 409。
        cartStore.closeCheckoutSnapshot(userStore.userId, {
          orderNo: order.orderNo,
          shopId: latest.shopId || order.shopId,
          status: latest.status,
        })
        showToast('订单已关闭，请重新下单')
        await refreshOrders()
        return
      }

      if (latest?.status !== 'PENDING') {
        showToast('当前订单状态不可继续支付')
        await refreshOrders()
        return
      }

      // 已有微信预支付单时，微信可对同单号重复下单，继续走原单续付。

      // 续付：只对已建订单重新拉起收银台，不重复建单。
      if (String(order.paymentChannel) !== 'WECHAT') {
        // 非微信渠道的旧订单在小程序端没法付款（支付宝 WAP 打不开），只能引导重新结算。
        showToast('该订单需重新结算，请回商家页重新下单')
        await refreshOrders()
        return
      }

      const result = await requestPayment({
        orderNo: order.orderNo,
        shopId: '',
        shopName: '',
        deliveryFee: 0,
        cartItems: [],
      })

      if (result.success) {
        // 收银台走完不等于到账，交给结果页查单确认。
        navigateTo(withQuery(ROUTES.PAYMENT_RESULT, {
          orderNo: order.orderNo,
          shopId: order.shopId,
          paymentChannel: 'WECHAT',
        }))
      }
      else if (result.outcome === 'closed') {
        cartStore.closeCheckoutSnapshot(userStore.userId, {
          orderNo: order.orderNo,
          shopId: order.shopId,
          status: 'CLOSED',
        })
        showToast(result.message || '订单已关闭，请重新下单')
        await refreshOrders()
      }
      else if (result.outcome === 'canceled') {
        showToast('已取消支付')
      }
      else {
        showToast(result.message || '继续支付失败，请稍后再试')
      }
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
