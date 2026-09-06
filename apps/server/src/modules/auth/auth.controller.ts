import type { Request } from 'express'
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiEmptyResponse, ApiErrorResponses, ApiSuccessResponse } from '../../common/swagger/api-response.decorator'
import { AuthService } from './auth.service'
import {
  AdminMenuResponseDto,
  AdminProfileResponseDto,
  AdminUpdatedProfileResponseDto,
  SecurityLogsResponseDto,
} from './dto/auth-response.dto'
import { LoginDto, LoginResponseDto } from './dto/login.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AdminAuthGuard } from './guards/admin-auth.guard'

interface AdminRequest extends Request {
  user: {
    id: number
    username: string
    role: string
    subjectType: 'admin'
  }
}

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private resolveClientIp(req: Request): string | undefined {
    const forwardedFor = req.headers['x-forwarded-for']
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor

    return req.ip || forwardedIp?.split(',')[0]?.trim() || req.socket?.remoteAddress
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '用户登录' })
  @ApiSuccessResponse(LoginResponseDto)
  @ApiErrorResponses(400, 401, 500)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = this.resolveClientIp(req)
    const userAgent = req.headers['user-agent']
    const account = loginDto.account || loginDto.username
    return this.authService.login(account, loginDto.password, ip, userAgent, loginDto.rememberMe)
  }

  @Get('profile')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiSuccessResponse(AdminProfileResponseDto)
  @ApiErrorResponses(401, 500)
  async getProfile(@Req() req: AdminRequest) {
    return this.authService.getProfile(req.user.id)
  }

  @Get('menus')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户可访问的菜单树' })
  @ApiArrayResponse(AdminMenuResponseDto)
  @ApiErrorResponses(401, 500)
  async getMenus(@Req() req: AdminRequest) {
    return this.authService.getUserMenus(req.user.id)
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前用户信息' })
  @ApiSuccessResponse(AdminUpdatedProfileResponseDto)
  @ApiErrorResponses(400, 401, 409, 500)
  async updateProfile(@Req() req: AdminRequest, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto)
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  @ApiEmptyResponse()
  @ApiErrorResponses(401, 500)
  async logout(@Req() req: AdminRequest) {
    return this.authService.logout(req.user.id)
  }

  @Get('security-logs')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取安全日志' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiSuccessResponse(SecurityLogsResponseDto)
  @ApiErrorResponses(400, 401, 500)
  async getSecurityLogs(
    @Req() req: AdminRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.authService.getSecurityLogs(req.user.id, page, pageSize)
  }
}
