import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ApiArrayResponse,
  ApiEmptyResponse,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../customer-auth/guards/customer-auth.guard'
import { CustomerAddressService } from './customer-address.service'
import { CustomerAddressResponseDto } from './dto/customer-address-response.dto'
import { CreateCustomerAddressDto } from './dto/customer-address.dto'

interface CustomerRequest {
  user: {
    id: number
    phone: string
    subjectType: 'customer'
  }
}

@ApiTags('用户端收货地址')
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

  @Post()
  @ApiOperation({ summary: '新增收货地址' })
  @ApiSuccessResponse(CustomerAddressResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  create(@Req() req: CustomerRequest, @Body() dto: CreateCustomerAddressDto) {
    return this.addresses.create(req.user.id, dto)
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
