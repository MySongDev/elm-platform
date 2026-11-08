import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { SuccessResponseDto } from '../../../common/swagger/dto/success-response.dto'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { MenuService } from '../../../modules/menu/menu.service'
import { MenuResponseDto } from './dto/menu-response.dto'
import { UpsertMenuDto } from './dto/menu.dto'

@ApiTags('管理端－菜单管理')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/system/menus')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminMenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getMenus',
    summary: '菜单列表',
  })
  @ApiArrayResponse(MenuResponseDto)
  getMenus() {
    return this.menuService.getMenus()
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_createMenu',
    summary: '创建菜单',
  })
  @ApiSuccessResponse(MenuResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createMenu(@Body() dto: UpsertMenuDto) {
    return this.menuService.createMenu(dto)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_updateMenu',
    summary: '更新菜单',
  })
  @ApiSuccessResponse(MenuResponseDto)
  @ApiErrorResponses(400, 404)
  updateMenu(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertMenuDto) {
    return this.menuService.updateMenu(id, dto)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_deleteMenu',
    summary: '删除菜单',
  })
  @ApiSuccessResponse(SuccessResponseDto)
  @ApiErrorResponses(400)
  deleteMenu(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteMenu(id)
  }
}
