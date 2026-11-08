import { AdminFoodController } from '@/api/admin/commerce/admin-food.controller'
import { AdminOrderController } from '@/api/admin/commerce/admin-order.controller'
import { AdminRestaurantController } from '@/api/admin/commerce/admin-restaurant.controller'
import { OrderQueryService } from '@/modules/order/order-query.service'
import { OrderWorkflowService } from '@/modules/order/order-workflow.service'
import { TenantContextService } from '@/modules/tenant/tenant-context.service'
import 'reflect-metadata'

function createController() {
  const paymentOrders = [{
    orderNo: 'ELMALI202605241200000001',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
  }]
  const orderQuery = {
    listAdminOrders: jest.fn().mockResolvedValue(paymentOrders),
    getAdminOrderDetail: jest.fn().mockResolvedValue({ orderNo: 'ELMALI202605241200000001' }),
  }
  const tenantContext = {
    fromRequestUser: jest.fn().mockResolvedValue({
      userId: 1,
      username: 'admin',
      tenantId: 10,
      tenantCode: 'flower-cake',
      tenantName: '鲜花蛋糕',
      tenantStatus: 'ACTIVE',
      dataScope: 'TENANT',
      boundShopIds: [],
      isPlatformAdmin: false,
    }),
  }
  const restaurantService = {
    listRestaurants: jest.fn().mockResolvedValue([]),
    createRestaurant: jest.fn().mockResolvedValue({ id: 1 }),
    updateRestaurant: jest.fn().mockResolvedValue({ id: 1 }),
    deleteRestaurant: jest.fn().mockResolvedValue({ status: 1 }),
  }
  const foodService = {
    listFoods: jest.fn().mockResolvedValue([]),
    createFood: jest.fn().mockResolvedValue({ item_id: 1 }),
    updateFood: jest.fn().mockResolvedValue({ item_id: 1 }),
    deleteFood: jest.fn().mockResolvedValue({ status: 1 }),
  }
  const orderWorkflow = {
    acceptOrder: jest.fn().mockResolvedValue({ fulfillmentStatus: 'ACCEPTED' }),
    startPreparing: jest.fn().mockResolvedValue({ fulfillmentStatus: 'PREPARING' }),
    startDelivery: jest.fn().mockResolvedValue({ fulfillmentStatus: 'DELIVERING' }),
    completeOrder: jest.fn().mockResolvedValue({ fulfillmentStatus: 'COMPLETED' }),
    approveRefund: jest.fn().mockResolvedValue({ refundStatus: 'APPROVED' }),
    rejectRefund: jest.fn().mockResolvedValue({ refundStatus: 'REJECTED' }),
  }
  const controller = new AdminOrderController(
    orderQuery as any,
    orderWorkflow as any,
    tenantContext as any,
  )
  const request = {
    user: {
      id: 1,
      username: 'admin',
    },
  }

  return {
    controller,
    orderQuery,
    orderWorkflow,
    paymentOrders,
    request,
    tenantContext,
    restaurantService,
    foodService,
    restaurantController: new AdminRestaurantController(restaurantService as any, tenantContext as any),
    foodController: new AdminFoodController(foodService as any, tenantContext as any),
  }
}

describe('elmAdminController order management', () => {
  it('keeps OrderQueryService and OrderWorkflowService as runtime dependencies', () => {
    const paramTypes = Reflect.getMetadata('design:paramtypes', AdminOrderController)

    expect(paramTypes).toContain(OrderQueryService)
    expect(paramTypes).toContain(OrderWorkflowService)
    expect(paramTypes).toContain(TenantContextService)
  })

  it('passes tenant context to admin restaurant and food services', async () => {
    const {
      restaurantController,
      foodController,
      request,
      tenantContext,
      restaurantService,
      foodService,
    } = createController()

    await restaurantController.getRestaurants(request)
    await foodController.getFoods(request)

    const context = await tenantContext.fromRequestUser.mock.results[0].value
    expect(restaurantService.listRestaurants).toHaveBeenCalledWith({ limit: 100 }, context)
    expect(foodService.listFoods).toHaveBeenCalledWith({ limit: 100 }, context)
  })

  it('reads admin orders from real payment orders', async () => {
    const {
      controller,
      orderQuery,
      paymentOrders,
      request,
      tenantContext,
    } = createController()
    const query = {
      limit: '20',
      shopId: '1',
    }

    await expect(controller.getOrders(request, query)).resolves.toBe(paymentOrders)
    const context = await tenantContext.fromRequestUser.mock.results[0].value
    expect(orderQuery.listAdminOrders).toHaveBeenCalledWith('20', context, query)
  })

  it('reads admin order detail from the query service', async () => {
    const {
      controller,
      orderQuery,
      request,
      tenantContext,
    } = createController()

    await controller.getOrderDetail('ELMALI202605241200000001', request)

    const context = await tenantContext.fromRequestUser.mock.results[0].value
    expect(orderQuery.getAdminOrderDetail).toHaveBeenCalledWith('ELMALI202605241200000001', context)
  })

  it('runs admin order actions with the authenticated admin operator', async () => {
    const {
      controller,
      orderWorkflow,
      request,
      tenantContext,
    } = createController()

    await controller.acceptOrder('ELMALI202605241200000001', request)
    await controller.startPreparing('ELMALI202605241200000001', request)
    await controller.startDelivery('ELMALI202605241200000001', request)
    await controller.completeOrder('ELMALI202605241200000001', request)

    const context = await tenantContext.fromRequestUser.mock.results[0].value
    expect(orderWorkflow.acceptOrder).toHaveBeenCalledWith('ELMALI202605241200000001', {
      operatorId: '1',
      operatorName: 'admin',
      operatorType: 'ADMIN',
    }, context)
    expect(orderWorkflow.startPreparing).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), context)
    expect(orderWorkflow.startDelivery).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), context)
    expect(orderWorkflow.completeOrder).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), context)
  })

  it('runs refund review actions with dto payloads', async () => {
    const {
      controller,
      orderWorkflow,
      request,
      tenantContext,
    } = createController()

    await controller.approveRefund('ELMALI202605241200000001', { remark: '同意退款' }, request)
    await controller.rejectRefund('ELMALI202605241200000001', { reason: '订单已开始制作' }, request)

    const context = await tenantContext.fromRequestUser.mock.results[0].value
    expect(orderWorkflow.approveRefund).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), '同意退款', context)
    expect(orderWorkflow.rejectRefund).toHaveBeenCalledWith('ELMALI202605241200000001', expect.objectContaining({ operatorType: 'ADMIN' }), '订单已开始制作', context)
  })
})
