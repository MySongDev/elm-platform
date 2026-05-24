import type { CreateUserDto, UpdateUserDto } from './dto/create-user.dto'
import type { UserService } from './user.service'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Roles } from '../auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@ApiTags('用户管理')
@Controller('users')
@UseGuards(AdminAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: '获取所有用户' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll() {
    return this.userService.findAll()
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '根据 ID 获取用户' })
  @ApiParam({ name: 'id', description: '用户 ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新用户' })
  @ApiParam({ name: 'id', description: '用户 ID', example: 1 })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户 ID', example: 1 })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id)
  }
}
