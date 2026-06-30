import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiEmptyResponse, ApiErrorResponses, ApiSuccessResponse } from '../../common/swagger/api-response.decorator'
import { SmsService } from '../sms/sms.service'
import { CustomerAuthService } from './customer-auth.service'
import {
  CustomerProfileResponseDto,
  CustomerTokenResponseDto,
  SmsSendResponseDto,
} from './dto/customer-auth-response.dto'
import {
  CustomerLogoutDto,
  CustomerPasswordLoginDto,
  CustomerRefreshTokenDto,
  CustomerRegisterDto,
  CustomerSmsLoginDto,
  SendSmsDto,
} from './dto/customer-auth.dto'
import { CustomerAuthGuard } from './guards/customer-auth.guard'

@ApiTags('用户端认证')
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(
    private readonly customerAuth: CustomerAuthService,
    private readonly sms: SmsService,
  ) {}

  @Post('sms/send')
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiSuccessResponse(SmsSendResponseDto, { status: 201 })
  @ApiErrorResponses(400, 429, 500)
  sendSms(@Body() dto: SendSmsDto) {
    return this.sms.sendCode(dto.phone, dto.scene)
  }

  @Post('register')
  @ApiOperation({ summary: '手机号注册' })
  @ApiSuccessResponse(CustomerTokenResponseDto, { status: 201 })
  @ApiErrorResponses(400, 409, 500)
  register(@Body() dto: CustomerRegisterDto) {
    return this.customerAuth.register(dto)
  }

  @Post('login/password')
  @ApiOperation({ summary: '手机号密码登录' })
  @ApiSuccessResponse(CustomerTokenResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 500)
  loginByPassword(@Body() dto: CustomerPasswordLoginDto) {
    return this.customerAuth.loginByPassword(dto)
  }

  @Post('login/sms')
  @ApiOperation({ summary: '手机号验证码登录' })
  @ApiSuccessResponse(CustomerTokenResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 500)
  loginBySms(@Body() dto: CustomerSmsLoginDto) {
    return this.customerAuth.loginBySms(dto)
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新用户端访问令牌' })
  @ApiSuccessResponse(CustomerTokenResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 500)
  refresh(@Body() dto: CustomerRefreshTokenDto) {
    return this.customerAuth.refresh(dto.refreshToken)
  }

  @Post('logout')
  @ApiOperation({ summary: '撤销用户端刷新令牌' })
  @ApiEmptyResponse()
  @ApiErrorResponses(400, 500)
  logout(@Body() dto: CustomerLogoutDto) {
    return this.customerAuth.logout(dto.refreshToken)
  }

  @Get('profile')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取普通用户信息' })
  @ApiSuccessResponse(CustomerProfileResponseDto)
  @ApiErrorResponses(401, 500)
  getProfile(@Request() req: any) {
    return this.customerAuth.getProfile(req.user.id)
  }
}
