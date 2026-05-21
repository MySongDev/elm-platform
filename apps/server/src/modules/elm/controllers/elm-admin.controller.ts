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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ElmFoodService } from '../services/elm-food.service';
import { ElmOrderService } from '../services/elm-order.service';
import { ElmRestaurantService } from '../services/elm-restaurant.service';
import type { FoodRecord, OrderRecord, RestaurantRecord } from '../types/elm.types';

@ApiTags('业务管理')
@ApiBearerAuth()
@Controller('admin/commerce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ElmAdminController {
  constructor(
    private readonly restaurantService: ElmRestaurantService,
    private readonly foodService: ElmFoodService,
    private readonly orderService: ElmOrderService,
  ) {}

  @Get('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: '管理端餐馆列表' })
  getRestaurants() {
    return this.restaurantService.listRestaurants({ limit: 100 });
  }

  @Post('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: '管理端创建餐馆' })
  createRestaurant(@Body() body: Partial<RestaurantRecord>) {
    return this.restaurantService.createRestaurant(body);
  }

  @Patch('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新餐馆' })
  updateRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<RestaurantRecord>,
  ) {
    return this.restaurantService.updateRestaurant(id, body);
  }

  @Delete('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端删除餐馆' })
  deleteRestaurant(@Param('id', ParseIntPipe) id: number) {
    return this.restaurantService.deleteRestaurant(id);
  }

  @Get('foods')
  @Roles('admin')
  @ApiOperation({ summary: '管理端食品列表' })
  getFoods() {
    return this.foodService.listFoods({ limit: 100 });
  }

  @Post('foods')
  @Roles('admin')
  @ApiOperation({ summary: '管理端创建食品' })
  createFood(@Body() body: Partial<FoodRecord>) {
    return this.foodService.createFood(body);
  }

  @Patch('foods/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新食品' })
  updateFood(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<FoodRecord>,
  ) {
    return this.foodService.updateFood(id, body);
  }

  @Delete('foods/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端删除食品' })
  deleteFood(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.deleteFood(id);
  }

  @Get('orders')
  @Roles('admin')
  @ApiOperation({ summary: '管理端订单列表' })
  getOrders() {
    return this.orderService.listOrders();
  }

  @Patch('orders/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新订单' })
  updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<OrderRecord>,
  ) {
    return this.orderService.updateOrder(id, body);
  }
}
