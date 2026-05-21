import { Injectable, NotFoundException } from '@nestjs/common';
import { createFood } from '../factories/elm.factories';
import type { FoodListQuery, FoodRecord } from '../types/elm.types';
import { nextNumberId, toNumberValue, toStringValue } from '../utils/elm-query';
import { ElmStoreService } from './elm-store.service';

@Injectable()
export class ElmFoodService {
  constructor(private readonly store: ElmStoreService) {}

  getFoodMenus(restaurantId: number) {
    return this.store.menuCategories
      .filter((category) => category.restaurant_id === restaurantId)
      .map((category) => ({
        ...category,
        foods: this.store.foods.filter((food) => food.category_id === category.id),
      }));
  }

  getFoodCategoryDetail(categoryId: number) {
    const category = this.store.menuCategories.find((item) => item.id === categoryId);
    if (!category) throw new NotFoundException('食品种类不存在');
    return category;
  }

  listFoods(query: FoodListQuery = {}) {
    const offset = toNumberValue(query.offset, 0);
    const limit = toNumberValue(query.limit, 20);
    const restaurantId = toNumberValue(query.restaurant_id, 0);
    const keyword = toStringValue(query.keyword).trim();

    let list = [...this.store.foods];
    if (restaurantId) list = list.filter((item) => item.restaurant_id === restaurantId);
    if (keyword) list = list.filter((item) => item.name.includes(keyword));
    return list.slice(offset, offset + limit);
  }

  countFoods() {
    return this.store.foods.length;
  }

  createFood(data: Partial<FoodRecord>) {
    const restaurantId = toNumberValue(data.restaurant_id, this.store.restaurants[0].id);
    const categoryId = toNumberValue(data.category_id, 0);
    const category =
      this.store.menuCategories.find((item) => item.id === categoryId && item.restaurant_id === restaurantId) ||
      this.store.menuCategories.find((item) => item.restaurant_id === restaurantId) ||
      this.store.menuCategories[0];
    const itemId = nextNumberId(this.store.foods.map((item) => item.item_id));
    const price = toNumberValue(data.specfoods?.[0]?.price, 20);
    const food = createFood(
      restaurantId,
      category.id,
      itemId,
      toStringValue(data.name, '新食品'),
      price,
      toStringValue(data.image_path, 'food/15c545e4a705.png'),
      toStringValue(data.description, ''),
    );

    this.store.foods.unshift(food);
    return food;
  }

  updateFood(itemId: number, data: Partial<FoodRecord>) {
    const index = this.store.foods.findIndex((item) => item.item_id === itemId);
    if (index < 0) throw new NotFoundException('食品不存在');

    const current = this.store.foods[index];
    const price = toNumberValue(data.specfoods?.[0]?.price, current.specfoods[0].price);
    this.store.foods[index] = {
      ...current,
      ...data,
      item_id: itemId,
      tips: `月售${toNumberValue(data.month_sales, current.month_sales)}份 好评率${toNumberValue(data.satisfy_rate, current.satisfy_rate)}%`,
      specfoods: current.specfoods.map((spec) => ({
        ...spec,
        name: toStringValue(data.name, current.name),
        price,
      })),
    };
    return this.store.foods[index];
  }

  deleteFood(itemId: number) {
    const foodIndex = this.store.foods.findIndex((item) => item.item_id === itemId);
    if (foodIndex >= 0) {
      this.store.foods.splice(foodIndex, 1);
    }

    return {
      status: 1,
      success: '删除食品成功',
    };
  }

  getRatingTags() {
    return [
      { name: '全部', count: 128, unsatisfied: false },
      { name: '满意', count: 118, unsatisfied: false },
      { name: '有图', count: 36, unsatisfied: false },
      { name: '不满意', count: 4, unsatisfied: true },
    ];
  }

  getRatings(offset = 0, limit = 10) {
    const list = Array.from({ length: 20 }, (_, index) => ({
      username: `用户${index + 1}`,
      rating_star: index % 5 === 0 ? 4 : 5,
      rated_at: '2026-05-17',
      time_spent_desc: '30分钟送达',
      rating_text: index % 4 === 0 ? '包装很好，味道也不错。' : '准时送达，整体满意。',
      item_ratings: [{ food_name: this.store.foods[index % this.store.foods.length].name }],
      avatar: 'default.jpg',
    }));
    return list.slice(offset, offset + limit);
  }
}
