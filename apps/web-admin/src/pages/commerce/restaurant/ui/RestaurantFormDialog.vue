<script setup lang="ts">
/**
 * @file 餐厅表单弹窗
 * @domain pages/commerce/restaurant
 * @description 有副作用：维护独立餐厅草稿、校验和保存，成功后通知页面刷新列表。
 */

import type { FormRules } from 'element-plus'
import type { RestaurantItem } from '../model/types'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createCommerceRestaurant, updateCommerceRestaurant } from '../api'
import { createRestaurantForm, toRestaurantPayload } from '../model/form'

defineOptions({ name: 'RestaurantFormDialog' })

const props = defineProps<{ restaurant: RestaurantItem | null }>()
const emit = defineEmits<{ saved: [] }>()
const visible = defineModel<boolean>('visible', { required: true })
const form = reactive(createRestaurantForm())
const saving = shallowRef(false)
const saveError = shallowRef(false)
let editorVersion = 0
let disposed = false
const { t } = useI18n()
const title = computed(() => t(props.restaurant ? 'crud.editTitle' : 'crud.addTitle', { title: t('commerce.restaurant.name') }))
const rules = computed<FormRules>(() => ({
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
}))

watch([visible, () => props.restaurant], ([open, restaurant]) => {
  editorVersion++
  Object.assign(form, createRestaurantForm(open ? restaurant : null))
  saving.value = false
  saveError.value = false
}, {
  immediate: true,
  flush: 'sync',
})

async function save() {
  if (saving.value || !visible.value || disposed)
    return

  const restaurant = props.restaurant
  const version = editorVersion
  const payload = toRestaurantPayload(form, restaurant)
  saving.value = true
  saveError.value = false
  try {
    if (restaurant)
      await updateCommerceRestaurant(restaurant.id, payload)
    else
      await createCommerceRestaurant(payload)

    // 关闭、切换餐厅或销毁后，旧请求不能关闭新弹窗，也不能发送旧的 saved。
    if (version !== editorVersion)
      return
    ElMessage.success(t('commerce.saveSuccess'))
    visible.value = false
    emit('saved')
  }
  catch {
    if (version === editorVersion)
      saveError.value = true
  }
  finally {
    if (version === editorVersion)
      saving.value = false
  }
}

onScopeDispose(() => {
  disposed = true
  editorVersion++
})
</script>

<template>
  <ConfigFormDialog
    v-model:visible="visible"
    :model="form"
    :title="title"
    :saving="saving"
    :rules="rules"
    @submit="save"
  >
    <el-alert
      v-if="saveError"
      type="error"
      :closable="false"
      :title="t('crud.saveFailed')"
      show-icon
    />
    <el-form-item
      :label="t('commerce.restaurant.name')"
      prop="name"
    >
      <el-input
        v-model="form.name"
        :placeholder="t('commerce.restaurant.namePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.category')"
      prop="category"
    >
      <el-input
        v-model="form.category"
        :placeholder="t('commerce.restaurant.categoryPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.address')"
      prop="address"
    >
      <el-input
        v-model="form.address"
        :placeholder="t('commerce.restaurant.addressPlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.phone')"
      prop="phone"
    >
      <el-input
        v-model="form.phone"
        :placeholder="t('commerce.restaurant.phonePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.image')"
      prop="image_path"
    >
      <el-input
        v-model="form.image_path"
        :placeholder="t('commerce.restaurant.imagePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.rating')"
      prop="rating"
    >
      <el-input-number
        v-model="form.rating"
        :min="0"
        :max="5"
        :step="0.1"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.recentOrders')"
      prop="recent_order_num"
    >
      <el-input-number
        v-model="form.recent_order_num"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.minOrderAmount')"
      prop="float_minimum_order_amount"
    >
      <el-input-number
        v-model="form.float_minimum_order_amount"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.deliveryFee')"
      prop="float_delivery_fee"
    >
      <el-input-number
        v-model="form.float_delivery_fee"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.distance')"
      prop="distance"
    >
      <el-input
        v-model="form.distance"
        :placeholder="t('commerce.restaurant.distancePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.deliveryTime')"
      prop="order_lead_time"
    >
      <el-input
        v-model="form.order_lead_time"
        :placeholder="t('commerce.restaurant.deliveryTimePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.restaurant.description')"
      prop="description"
    >
      <el-input
        v-model="form.description"
        type="textarea"
        :placeholder="t('commerce.restaurant.descriptionPlaceholder')"
        :rows="3"
      />
    </el-form-item>
  </ConfigFormDialog>
</template>
