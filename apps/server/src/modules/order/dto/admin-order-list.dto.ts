import { ApiProperty, OmitType } from '@nestjs/swagger'
import { AdminOrderDetailDto } from './admin-order-detail.dto'

/**
 * 管理端订单列表项。
 * 列表项与订单详情字段一致,唯一区别是列表不返回 actionLogs(操作日志仅详情接口给)。
 * 用 OmitType 从详情 DTO 派生,保证两者字段和 Swagger schema 始终同源、不会各写一份而漂移。
 */
export class AdminOrderSummaryDto extends OmitType(AdminOrderDetailDto, ['actionLogs'] as const) {}

/**
 * 管理端订单列表的 HTTP 响应信封,结构与详情响应保持一致:{ code, message, data, timestamp }。
 * data 为订单列表数组。用于 getOrders 的 @ApiOkResponse,使前端能从 OpenAPI 生成到真实类型。
 */
export class AdminOrderListHttpResponseDto {
  @ApiProperty({ example: 200 })
  code: number

  @ApiProperty({ example: 'success' })
  message: string

  @ApiProperty({ type: [AdminOrderSummaryDto] })
  data: AdminOrderSummaryDto[]

  @ApiProperty({ example: '2026-06-08T00:00:00.000Z' })
  timestamp: string
}
