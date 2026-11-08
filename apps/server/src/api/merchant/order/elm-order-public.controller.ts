import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmOrderService } from '../../../modules/elm-legacy/services/elm-order.service'

@ApiTags('商家端－兼容订单')
@Controller()
export class ElmOrderPublicController {
  constructor(private readonly orderService: ElmOrderService) {}

  @Get('bos/orders')
  @ApiOperation({ summary: '订单列表' })
  getOrders() {
    return rawResponse(this.orderService.listOrders())
  }

  @Get('bos/orders/count')
  @ApiOperation({ summary: '订单数量' })
  getOrderCount() {
    return rawResponse({
      status: 1,
      count: this.orderService.countOrders(),
    })
  }
}
