import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../common/interceptors/transform.interceptor'
import { ApiErrorResponses, ApiRawResponse } from '../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../customer-auth/guards/customer-auth.guard'
/**
 * 这里复用的是 payment 模块下的响应 DTO，但它描述的其实是**订单摘要**这个领域对象
 * （字段与 `OrderWorkflowService.toOrderSummary()` 的返回值一一对应）。
 * 它当初随支付宝建单端点落地才放在 payment 模块下，现在 `GET /api/orders`（PaymentController.listOrders）
 * 与 `POST /api/orders`（本控制器）返回的是同一个 schema。
 *
 * 不在 order 模块复制一份的原因：两份 `@ApiProperty` 会各自漂移，
 * 而 OpenAPI 里会多出一个字段相同、名字不同的 schema，前端类型也随之分裂。
 */
import { PaymentOrderSummaryResponseDto } from '../payment/dto/payment-response.dto'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderWorkflowService } from './order-workflow.service'

/**
 * 用户端建单入口（不含支付渠道）。
 *
 * ⚠️ 本控制器与 `PaymentController` 是**并存的两个建单入口**，这是刻意的，
 * 完整原因见 `payment.service.ts` 中 `createAlipayWapPayment` 上方的说明。
 * 一句话：`POST /api/orders` 只建单不绑渠道（微信小程序端用），
 * `POST /api/payments/alipay/wap/create` 建单后立刻生成支付宝支付链接（web-user H5 在用，行为不变）。
 */
@ApiTags('订单')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderWorkflow: OrderWorkflowService) {}

  /**
   * 创建一笔待支付订单（PENDING）。
   *
   * 与支付宝建单端点的差异：**不返回 payUrl**，也不调用任何支付渠道。
   * 后续支付由各端自行发起 —— H5 可用 `POST /api/payments/alipay/wap/resume`（传 orderNo）继续支付，
   * 小程序端在接入微信支付前保持 PENDING。
   *
   * 响应结构与 `GET /api/orders` 列表里的单项一致，前端拿到即可直接渲染。
   */
  @Post()
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建订单（不含支付）' })
  @ApiRawResponse(PaymentOrderSummaryResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 500)
  async createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    // userId 一律取自守卫解析出的 token，不接受请求体传入（见 CreateOrderDto 注释）
    const result = await this.orderWorkflow.createOrder({
      ...dto,
      userId: String(req.user.id),
    })
    return rawResponse(result)
  }
}
