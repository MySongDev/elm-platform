/**
 * @file 餐厅管理组合式状态
 * @domain features/restaurant-management
 * @description 聚合餐厅 CRUD、查询过滤和表单校验，是餐厅管理页面的业务状态边界。
 */

import type { FormRules } from 'element-plus'
import type { RestaurantItem } from '@/entities/restaurant'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCommerceRestaurant,
  deleteCommerceRestaurant,
  getCommerceRestaurants,
  updateCommerceRestaurant,
} from '@/entities/restaurant'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'

export interface RestaurantQuery {
  name: string
  category: string
}

export interface RestaurantFormState {
  id: number
  name: string
  address: string
  phone: string
  category: string
  image_path: string
  rating: number
  recent_order_num: number
  float_minimum_order_amount: number
  float_delivery_fee: number
  distance: string
  order_lead_time: string
  description: string
}

const defaultForm: RestaurantFormState = {
  id: 0,
  name: '',
  address: '',
  phone: '',
  category: '',
  image_path: '',
  rating: 0,
  recent_order_num: 0,
  float_minimum_order_amount: 20,
  float_delivery_fee: 5,
  distance: '',
  order_lead_time: '',
  description: '',
}

/**
 * @description 有副作用：调用餐厅接口，维护餐厅表格/表单状态，并通过 CRUD feedback 触发确认与提示。
 * @returns 餐厅管理页面使用的 CRUD 状态、校验规则和操作函数。
 */
export function useRestaurantManagement() {
  const { t } = useI18n()

  const crud = useConfigCrud<RestaurantItem, RestaurantQuery, RestaurantFormState, Partial<RestaurantItem>>({
    getDefaultQuery: () => ({
      name: '',
      category: '',
    }),
    getDefaultForm: () => ({ ...defaultForm }),
    fetchList: getCommerceRestaurants,
    createItem: createCommerceRestaurant,
    updateItem: updateCommerceRestaurant,
    deleteItem: deleteCommerceRestaurant,
    getFormId: form => form.id,
    getRowId: row => row.id,
    filterItem: (item, query) => {
      const nameMatched = !query.name || item.name.includes(query.name)
      const categoryMatched = !query.category || item.category.includes(query.category)
      return nameMatched && categoryMatched
    },
    deleteConfirm: row => t('commerce.restaurant.deleteConfirm', { name: row.name }),
    saveSuccessMessage: t('commerce.saveSuccess'),
    deleteSuccessMessage: t('commerce.deleteSuccess'),
    feedback: createElementPlusCrudFeedback(),
  })

  const rules: FormRules = {
    name: [{
      required: true,
      message: t('commerce.restaurant.nameRequired'),
      trigger: 'blur',
    }],
    address: [{
      required: true,
      message: t('commerce.restaurant.addressRequired'),
      trigger: 'blur',
    }],
    category: [{
      required: true,
      message: t('commerce.restaurant.categoryRequired'),
      trigger: 'blur',
    }],
  }

  async function batchDeleteRows(rows: RestaurantItem[]) {
    if (rows.length === 0)
      return

    try {
      await ElMessageBox.confirm(t('tableEnhance.batchDeleteConfirm', { count: rows.length }), t('common.tip'), { type: 'warning' })
    }
    catch {
      return
    }

    await Promise.all(rows.map(row => deleteCommerceRestaurant(row.id)))
    ElMessage.success(t('commerce.deleteSuccess'))
    await crud.fetchRows()
  }

  return {
    ...crud,
    rules,
    batchDeleteRows,
  }
}
