import { readonly, shallowRef, toValue } from 'vue'

import { showAlert } from '@/components/common/AlterTip'
import { getAlipayPaymentStatus, resumeAlipayWapPayment } from '@/services/api/api-payment'

function defaultRedirectToPayUrl(payUrl) {
  window.location.href = payUrl
}

export function useContinuePayment({
  currentUserId,
  fetchOrders,
  goLogin,
  redirectToPayUrl = defaultRedirectToPayUrl,
}) {
  const continuingOrderNo = shallowRef('')

  async function refreshOrders() {
    await fetchOrders?.()
  }

  async function continuePayment(order) {
    if (!toValue(currentUserId)) {
      goLogin()
      return
    }

    if (!order?.orderNo || continuingOrderNo.value)
      return

    continuingOrderNo.value = order.orderNo

    try {
      const latest = await getAlipayPaymentStatus(order.orderNo, true)

      if (latest?.status === 'PAID') {
        showAlert('订单已支付')
        await refreshOrders()
        return
      }

      if (latest?.status === 'CLOSED') {
        showAlert('订单已关闭，请重新下单')
        await refreshOrders()
        return
      }

      if (latest?.status !== 'PENDING') {
        showAlert('当前订单状态不可继续支付')
        await refreshOrders()
        return
      }

      const { payUrl } = await resumeAlipayWapPayment({
        orderNo: order.orderNo,
      })

      if (!payUrl) {
        showAlert('未获取到支付宝支付链接，请稍后再试')
        return
      }

      redirectToPayUrl(payUrl)
    }
    catch (err) {
      showAlert(err?.message || '继续支付失败，请稍后再试')
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
