import type { PaymentService } from '../../payment/payment.service'
import type { ElmFoodService } from '../services/elm-food.service'
import type { ElmRestaurantService } from '../services/elm-restaurant.service'
import type { FoodRecord, RestaurantRecord } from '../types/elm.types'
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'

@ApiTags('业务管理')
@ApiBearerAuth()
@Controller('admin/commerce')
@UseGuards(AdminAuthGuard, RolesGuard)
export class ElmAdminController {
  constructor(
    private readonly restaurantService: ElmRestaurantService,
    private readonly foodService: ElmFoodService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: '管理端餐馆列表' })
  getRestaurants() {
    return this.restaurantService.listRestaurants({ limit: 100 })
  }

  @Post('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: '管理端创建餐馆' })
  createRestaurant(@Body() body: Partial<RestaurantRecord>) {
    return this.restaurantService.createRestaurant(body)
  }

  @Patch('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新餐馆' })
  updateRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<RestaurantRecord>,
  ) {
    return this.restaurantService.updateRestaurant(id, body)
  }

  @Delete('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端删除餐馆' })
  deleteRestaurant(@Param('id', ParseIntPipe) id: number) {
    return this.restaurantService.deleteRestaurant(id)
  }

  @Get('foods')
  @Roles('admin')
  @ApiOperation({ summary: '管理端食品列表' })
  getFoods() {
    return this.foodService.listFoods({ limit: 100 })
  }

  @Post('foods')
  @Roles('admin')
  @ApiOperation({ summary: '管理端创建食品' })
  createFood(@Body() body: Partial<FoodRecord>) {
    return this.foodService.createFood(body)
  }

  @Patch('foods/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新食品' })
  updateFood(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<FoodRecord>,
  ) {
    return this.foodService.updateFood(id, body)
  }

  @Delete('foods/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端删除食品' })
  deleteFood(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.deleteFood(id)
  }

  @Get('orders')
  @Roles('admin')
  @ApiOperation({ summary: '管理端真实支付订单列表' })
  getOrders() {
    return this.paymentService.listAdminOrders()
  }
}
