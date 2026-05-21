import express from 'express'

import { config, hasAlipayConfig } from './config.js'
import { createWapPayForm, getAlipaySdk, queryTrade, verifyNotifySignature } from './lib/alipay.js'
import { getOrder, listOrders, saveOrder, updateOrder } from './store/orders.js'
import { buildOrderPayload, createOrderNo, mapTradeStatus } from './utils/order.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

function toOrderSummary(order) {
  return {
    orderNo: order.orderNo,
    userId: order.userId,
    shopId: order.shopId,
    shopName: order.shopName,
    status: order.status,
    tradeStatus: order.tradeStatus,
    payableAmount: order.payableAmount,
    goodsAmount: order.goodsAmount,
    deliveryFee: order.deliveryFee,
    cartItems: order.cartItems || [],
    totalQty: (order.cartItems || []).reduce((sum, item) => sum + Number(item.qty || 0), 0),
    paidAt: order.paidAt || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    tradeNo: order.tradeNo || null,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasAlipayConfig: hasAlipayConfig(),
    orderCount: listOrders().length,
  })
})

app.get('/api/payments/alipay/test-connection', async (_req, res) => {
  try {
    const sdk = getAlipaySdk()
    const result = await sdk.exec('alipay.trade.query', {
      bizContent: { out_trade_no: 'TEST_CONNECTION_CHECK' },
    })
    res.json({ ok: true, result })
  }
  catch (error) {
    res.json({ ok: false, message: error.message, code: error.code })
  }
})

app.post('/api/payments/alipay/wap/create', async (req, res) => {
  try {
    const summary = buildOrderPayload(req.body)

    if (!summary.userId) {
      return res.status(401).json({ message: '请登录后再支付' })
    }

    if (!summary.cartItems.length) {
      return res.status(400).json({ message: '购物车为空，无法创建支付单' })
    }

    if (summary.payableAmount <= 0) {
      return res.status(400).json({ message: '订单金额异常，无法创建支付单' })
    }

    const orderNo = createOrderNo()
    const order = saveOrder({
      orderNo,
      status: 'PENDING',
      tradeStatus: 'WAIT_BUYER_PAY',
      subject: `${summary.shopName} 外卖订单`,
      ...summary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const payUrl = await createWapPayForm(order)

    return res.json({
      orderNo,
      payUrl,
      payableAmount: order.payableAmount,
    })
  }
  catch (error) {
    console.error('[alipay:create]', error)
    return res.status(500).json({
      message: error.message || '创建支付宝支付单失败',
    })
  }
})

app.post('/api/payments/alipay/notify', async (req, res) => {
  try {
    const isValid = await verifyNotifySignature(req.body)
    if (!isValid)
      return res.status(400).send('failure')

    const orderNo = req.body.out_trade_no
    const order = getOrder(orderNo)
    if (!order)
      return res.status(404).send('failure')

    if (config.sellerId && req.body.seller_id !== config.sellerId)
      return res.status(400).send('failure')

    if (req.body.app_id !== config.appId)
      return res.status(400).send('failure')

    if (Number.parseFloat(req.body.total_amount) !== order.payableAmount)
      return res.status(400).send('failure')

    updateOrder(orderNo, {
      tradeNo: req.body.trade_no,
      tradeStatus: req.body.trade_status,
      status: mapTradeStatus(req.body.trade_status),
      notifyPayload: req.body,
      paidAt: req.body.gmt_payment || null,
    })

    return res.send('success')
  }
  catch (error) {
    console.error('[alipay:notify]', error)
    return res.status(500).send('failure')
  }
})

app.get('/api/orders', (req, res) => {
  const userId = String(req.query.userId || '')
  if (!userId) {
    return res.status(400).json({ message: '缺少用户信息' })
  }

  const orders = listOrders({
    userId,
    limit: req.query.limit,
  }).map(toOrderSummary)

  return res.json({ orders })
})

app.get('/api/payments/alipay/status/:orderNo', async (req, res) => {
  const { orderNo } = req.params
  const order = getOrder(orderNo)

  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }

  try {
    if (req.query.refresh === '1' && hasAlipayConfig()) {
      const trade = await queryTrade(orderNo)
      const tradeStatus = trade?.trade_status || order.tradeStatus

      updateOrder(orderNo, {
        tradeNo: trade?.trade_no || order.tradeNo,
        tradeStatus,
        status: mapTradeStatus(tradeStatus),
        queryPayload: trade,
        buyerPayAmount: trade?.buyer_pay_amount || null,
      })
    }
  }
  catch (error) {
    console.error('[alipay:status]', error)
  }

  const latestOrder = getOrder(orderNo)
  return res.json({
    orderNo: latestOrder.orderNo,
    userId: latestOrder.userId,
    shopId: latestOrder.shopId,
    status: latestOrder.status,
    tradeStatus: latestOrder.tradeStatus,
    payableAmount: latestOrder.payableAmount,
    shopName: latestOrder.shopName,
    goodsAmount: latestOrder.goodsAmount,
    deliveryFee: latestOrder.deliveryFee,
    cartItems: latestOrder.cartItems || [],
    paidAt: latestOrder.paidAt || null,
    createdAt: latestOrder.createdAt,
    updatedAt: latestOrder.updatedAt,
    tradeNo: latestOrder.tradeNo || null,
  })
})

app.listen(config.port, () => {
  console.log(`Alipay demo server running at http://127.0.0.1:${config.port}`)
  console.log(`Health check: http://127.0.0.1:${config.port}/api/health`)
})
