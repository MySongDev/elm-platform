import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { rawResponse } from '../../../common/interceptors/transform.interceptor';
import { ElmUserCompatService } from '../services/elm-user-compat.service';

@ApiTags('Elm 兼容接口 - 用户')
@Controller()
export class ElmUserPublicController {
  constructor(private readonly userCompatService: ElmUserCompatService) {}

  @Post('v1/captchas')
  @ApiOperation({ summary: '获取验证码' })
  getCaptchas() {
    return rawResponse(this.userCompatService.createCaptcha());
  }

  @Post('v2/login')
  @ApiOperation({ summary: '账号密码登录' })
  login(@Body() body: Record<string, unknown>) {
    return rawResponse(this.userCompatService.login(body));
  }

  @Post('v1/login/app_mobile')
  @ApiOperation({ summary: '手机号登录' })
  mobileLogin(@Body() body: Record<string, unknown>) {
    return rawResponse(this.userCompatService.login(body));
  }

  @Get('v1/user')
  @ApiOperation({ summary: '获取用户信息' })
  getUser(@Query('user_id') userId?: string) {
    return rawResponse(this.userCompatService.getUserInfo(Number(userId)));
  }

  @Post('v2/changepassword')
  @ApiOperation({ summary: '修改密码' })
  changePassword() {
    return rawResponse(this.userCompatService.changePassword());
  }

  @Get('v2/signout')
  @ApiOperation({ summary: '退出登录' })
  signout() {
    return rawResponse(this.userCompatService.signout());
  }

  @Get('v1/users/:userId/addresses')
  @ApiOperation({ summary: '获取收货地址列表' })
  getAddresses(@Param('userId', ParseIntPipe) userId: number) {
    return rawResponse(this.userCompatService.listAddresses(userId));
  }

  @Post('v1/users/:userId/addresses')
  @ApiOperation({ summary: '新增收货地址' })
  addAddress(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return rawResponse(this.userCompatService.addAddress(userId, body));
  }

  @Delete('v1/users/:userId/addresses/:addressId')
  @ApiOperation({ summary: '删除收货地址' })
  deleteAddress(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    return rawResponse(this.userCompatService.deleteAddress(userId, addressId));
  }

  @Post('eus/v1/users/:userId/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上传用户头像' })
  uploadAvatar(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() _file?: unknown,
  ) {
    return rawResponse(this.userCompatService.uploadAvatar(userId));
  }
}
