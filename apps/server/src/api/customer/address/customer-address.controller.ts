import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiEmptyResponse, ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { CustomerAddressService } from '../../../modules/customer-address/customer-address.service'
import { CustomerAuthGuard } from '../../../modules/customer-auth/guards/customer-auth.guard'
import { CustomerAddressResponseDto } from './dto/customer-address-response.dto'
import { CreateCustomerAddressDto, UpdateCustomerAddressDto } from './dto/customer-address.dto'

interface CustomerRequest {
  user: {
    id: number
    phone: string
    subjectType: 'customer'
  }
}

@ApiTags('消费者端－收货地址')
@ApiBearerAuth()
@ApiErrorResponses(401, 500)
@UseGuards(CustomerAuthGuard)
@Controller('customer-addresses')
export class CustomerAddressController {
  constructor(private readonly addresses: CustomerAddressService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的收货地址列表' })
  @ApiArrayResponse(CustomerAddressResponseDto)
  list(@Req() req: CustomerRequest) {
    return this.addresses.list(req.user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取当前用户的收货地址详情' })
  @ApiSuccessResponse(CustomerAddressResponseDto)
  @ApiErrorResponses(400, 404)
  detail(@Req() req: CustomerRequest, @Param('id', ParseIntPipe) id: number) {
    return this.addresses.detail(req.user.id, id)
  }

  @Post()
  @ApiOperation({ summary: '新增收货地址' })
  @ApiSuccessResponse(CustomerAddressResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  create(@Req() req: CustomerRequest, @Body() dto: CreateCustomerAddressDto) {
    return this.addresses.create(req.user.id, dto)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新收货地址' })
  @ApiParam({
    name: 'id',
    description: '地址 ID',
    example: 1,
  })
  @ApiSuccessResponse(CustomerAddressResponseDto)
  @ApiErrorResponses(400, 404)
  update(
    @Req() req: CustomerRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    return this.addresses.update(req.user.id, id, dto)
  }

  // PATCH保留给旧调用；小程序的整表单编辑走PUT，仍使用同一套归属检查。
  @Put(':id')
  @ApiOperation({ summary: '全量更新收货地址' })
  @ApiSuccessResponse(CustomerAddressResponseDto)
  @ApiErrorResponses(400, 404)
  replace(
    @Req() req: CustomerRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    return this.addresses.update(req.user.id, id, dto)
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设为默认收货地址' })
  @ApiParam({
    name: 'id',
    description: '地址 ID',
    example: 1,
  })
  @ApiEmptyResponse()
  @ApiErrorResponses(400, 404)
  setDefault(
    @Req() req: CustomerRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addresses.setDefault(req.user.id, id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除收货地址' })
  @ApiEmptyResponse()
  @ApiErrorResponses(404)
  remove(
    @Req() req: CustomerRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addresses.remove(req.user.id, id)
  }
}
