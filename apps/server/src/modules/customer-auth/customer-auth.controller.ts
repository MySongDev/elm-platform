import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SmsService } from '../sms/sms.service';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerPasswordLoginDto, CustomerRegisterDto, CustomerSmsLoginDto, SendSmsDto } from './dto/customer-auth.dto';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@ApiTags('用户端认证')
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(
    private readonly customerAuth: CustomerAuthService,
    private readonly sms: SmsService,
  ) {}

  @Post('sms/send')
  @ApiOperation({ summary: '发送短信验证码' })
  sendSms(@Body() dto: SendSmsDto) {
    return this.sms.sendCode(dto.phone, dto.scene);
  }

  @Post('register')
  @ApiOperation({ summary: '手机号注册' })
  register(@Body() dto: CustomerRegisterDto) {
    return this.customerAuth.register(dto);
  }

  @Post('login/password')
  @ApiOperation({ summary: '手机号密码登录' })
  loginByPassword(@Body() dto: CustomerPasswordLoginDto) {
    return this.customerAuth.loginByPassword(dto);
  }

  @Post('login/sms')
  @ApiOperation({ summary: '手机号验证码登录' })
  loginBySms(@Body() dto: CustomerSmsLoginDto) {
    return this.customerAuth.loginBySms(dto);
  }

  @Get('profile')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取普通用户信息' })
  getProfile(@Request() req: any) {
    return this.customerAuth.getProfile(req.user.id);
  }
}
