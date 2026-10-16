// ⚠️ 与 apps/web-user/src/views/order/composables/useRequestRefund.js 同源改造。
// 修改需同步两处。
//
// ★ 与 web-user 的差异：
// 1. `showDialog`/`showToast`（vant 命令式）→ platform/feedback 的
//    showConfirm/showToast（uni.showModal/uni.showToast 封装，Promise 语义一致）
// 2. 纯逻辑：申请退款 + 重新拉列表，端无关
import { showConfirm, showToast } from '@/platform/feedback'
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
      await showConfirm({
        title: '申请退款失败',
        content: error?.message || '当前订单状态已变化，请刷新后重试',
      })
      return false
    }
  }

  return {
    requestRefund,
  }
}
