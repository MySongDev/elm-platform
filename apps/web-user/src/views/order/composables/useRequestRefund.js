import { showDialog, showToast } from 'vant'
import { requestOrderRefund } from '@/services/api/api-payment'

export function useRequestRefund({ fetchOrders }) {
  async function requestRefund(order, reason) {
    const normalizedReason = String(reason || '').trim()

    if (!normalizedReason)
      return false

    if (normalizedReason.length < 2) {
      showToast('退款原因不少于 2 个字')
      return false
    }

    try {
      await requestOrderRefund({
        orderNo: order.orderNo,
        reason: normalizedReason,
      })
      showToast('退款申请已提交')
      await fetchOrders()
      return true
    }
    catch (error) {
      await showDialog({
        title: '申请退款失败',
        message: error?.message || '当前订单状态已变化，请刷新后重试',
      })
      return false
    }
  }

  return {
    requestRefund,
  }
}
