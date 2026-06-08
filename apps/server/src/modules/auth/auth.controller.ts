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
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto, LoginHttpResponseDto } from './dto/login.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AdminAuthGuard } from './guards/admin-auth.guard'

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '用户登录' })
  @ApiOkResponse({
    description: 'Admin login response envelope',
    type: LoginHttpResponseDto,
  })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    const userAgent = req.headers['user-agent']
    const account = loginDto.account || loginDto.username
    return this.authService.login(account, loginDto.password, ip, userAgent, loginDto.rememberMe)
  }

  @Get('profile')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id)
  }

  @Get('menus')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户可访问的菜单树' })
  async getMenus(@Request() req: any) {
    return this.authService.getUserMenus(req.user.id)
  }

  @Patch('profile')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前用户信息' })
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto)
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  async logout(@Request() req: any) {
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
  async getSecurityLogs(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.authService.getSecurityLogs(req.user.id, page, pageSize)
  }
}
