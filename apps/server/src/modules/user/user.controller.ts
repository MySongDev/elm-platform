import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import {
  ApiArrayResponse,
  ApiEmptyResponse,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/swagger/api-response.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { TenantContextService } from '../tenant/tenant-context.service'
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { UserService } from './user.service'

@ApiTags('用户管理')
@ApiErrorResponses(401, 403, 500)
@Controller('users')
@UseGuards(AdminAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户' })
  @ApiSuccessResponse(UserResponseDto, { status: 201 })
  @ApiErrorResponses(400, 409)
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.userService.create(createUserDto, context)
  }

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: '获取所有用户' })
  @ApiArrayResponse(UserResponseDto)
  findAll() {
    return this.userService.findAll()
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '根据 ID 获取用户' })
  @ApiParam({
    name: 'id',
    description: '用户 ID',
    example: 1,
  })
  @ApiSuccessResponse(UserResponseDto)
  @ApiErrorResponses(400, 404)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新用户' })
  @ApiParam({
    name: 'id',
    description: '用户 ID',
    example: 1,
  })
  @ApiSuccessResponse(UserResponseDto)
  @ApiErrorResponses(400, 404, 409)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.userService.update(id, updateUserDto, context)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({
    name: 'id',
    description: '用户 ID',
    example: 1,
  })
  @ApiEmptyResponse()
  @ApiErrorResponses(400, 404)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id)
  }
}
