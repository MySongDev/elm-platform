import type { Request } from 'express'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { CustomerAuthGuard } from '../../customer-auth/guards/customer-auth.guard'
import { ElmUserCompatService } from '../services/elm-user-compat.service'

interface CustomerRequest extends Request {
  user: {
    id: number
    phone: string
    subjectType: 'customer'
  }
}

@ApiTags('Elm 兼容接口 - 用户')
@Controller()
export class ElmUserPublicController {
  constructor(private readonly userCompatService: ElmUserCompatService) {}

  @Post('v1/captchas')
  @ApiOperation({ summary: '获取验证码' })
  getCaptchas() {
    return rawResponse(this.userCompatService.createCaptcha())
  }

  @Post('v2/login')
  @ApiOperation({ summary: '账号密码登录' })
  login(@Body() body: Record<string, unknown>) {
    return rawResponse(this.userCompatService.login(body))
  }

  @Post('v1/login/app_mobile')
  @ApiOperation({ summary: '手机号登录' })
  mobileLogin(@Body() body: Record<string, unknown>) {
    return rawResponse(this.userCompatService.login(body))
  }

  @Get('v1/user')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  getUser(@Req() req: CustomerRequest) {
    return rawResponse(this.userCompatService.getUserInfo(req.user.id))
  }

  @Post('v2/changepassword')
  @ApiOperation({ summary: '修改密码' })
  changePassword() {
    return rawResponse(this.userCompatService.changePassword())
  }

  @Get('v2/signout')
  @ApiOperation({ summary: '退出登录' })
  signout() {
    return rawResponse(this.userCompatService.signout())
  }

  // 以下接口保留路径中的 :userId 段，以维持前端既有 URL 形状（前端零改动即可迁移），
  // 但方法不声明该参数——身份一律取自 token 解出的 req.user.id，客户端传值不生效。
  @Get('v1/users/:userId/addresses')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取收货地址列表' })
  getAddresses(@Req() req: CustomerRequest) {
    return rawResponse(this.userCompatService.listAddresses(req.user.id))
  }

  @Post('v1/users/:userId/addresses')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '新增收货地址' })
  addAddress(@Req() req: CustomerRequest, @Body() body: Record<string, unknown>) {
    return rawResponse(this.userCompatService.addAddress(req.user.id, body))
  }

  @Delete('v1/users/:userId/addresses/:addressId')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除收货地址' })
  deleteAddress(
    @Req() req: CustomerRequest,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    return rawResponse(this.userCompatService.deleteAddress(req.user.id, addressId))
  }

  @Post('eus/v1/users/:userId/avatar')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传用户头像' })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Req() req: CustomerRequest,
    @UploadedFile() _file?: unknown,
  ) {
    return rawResponse(this.userCompatService.uploadAvatar(req.user.id))
  }
}
