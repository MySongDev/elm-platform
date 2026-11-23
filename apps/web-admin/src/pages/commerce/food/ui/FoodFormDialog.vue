<script setup lang="ts">
/**
 * @file 食品表单弹窗
 * @domain pages/commerce/food
 * @description 有副作用：维护独立食品草稿、校验和保存，成功后通知页面刷新列表。
 */

import type { FormRules } from 'element-plus'
import type { FoodItem } from '../model/types'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConfigFormDialog } from '@/shared/config-crud'
import { createCommerceFood, updateCommerceFood } from '../api'
import { createFoodForm, toFoodPayload } from '../model/form'

defineOptions({ name: 'FoodFormDialog' })

const props = defineProps<{ food: FoodItem | null }>()
const emit = defineEmits<{ saved: [] }>()
const visible = defineModel<boolean>('visible', { required: true })
const form = reactive(createFoodForm())
const saving = shallowRef(false)
const saveError = shallowRef(false)
let editorVersion = 0
const { t } = useI18n()
const title = computed(() => t(props.food ? 'crud.editTitle' : 'crud.addTitle', { title: t('commerce.food.name') }))
const rules = computed<FormRules>(() => ({
  name: [{
    required: true,
    message: t('commerce.food.nameRequired'),
    trigger: 'blur',
  }],
  restaurant_id: [{
    required: true,
    message: t('commerce.food.restaurantIdRequired'),
    trigger: 'blur',
  }],
}))

watch([visible, () => props.food], ([open, food]) => {
  editorVersion++
  Object.assign(form, createFoodForm(open ? food : null))
  saving.value = false
  saveError.value = false
}, {
  immediate: true,
  flush: 'sync',
})

async function save() {
  if (saving.value || !visible.value)
    return

  const food = props.food
  const version = editorVersion
  const payload = toFoodPayload(form, food)
  saving.value = true
  saveError.value = false
  try {
    if (food)
      await updateCommerceFood(food.item_id, payload)
    else
      await createCommerceFood(payload)

    // 关闭、切换食品或销毁后，旧请求不能关闭新弹窗，也不能发送旧的 saved。
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
      :label="t('commerce.food.name')"
      prop="name"
    >
      <el-input
        v-model="form.name"
        :placeholder="t('commerce.food.namePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.restaurantId')"
      prop="restaurant_id"
    >
      <el-input-number
        v-model="form.restaurant_id"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.categoryId')"
      prop="category_id"
    >
      <el-input-number
        v-model="form.category_id"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.image')"
      prop="image_path"
    >
      <el-input
        v-model="form.image_path"
        :placeholder="t('commerce.food.imagePlaceholder')"
        clearable
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.price')"
      prop="price"
    >
      <el-input-number
        v-model="form.price"
        :min="0"
        :precision="2"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.packingFee')"
      prop="packing_fee"
    >
      <el-input-number
        v-model="form.packing_fee"
        :min="0"
        :precision="2"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.originalPrice')"
      prop="original_price"
    >
      <el-input-number
        v-model="form.original_price"
        :min="0"
        :precision="2"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.monthlySales')"
      prop="month_sales"
    >
      <el-input-number
        v-model="form.month_sales"
        :min="0"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.satisfactionRate')"
      prop="satisfy_rate"
    >
      <el-input-number
        v-model="form.satisfy_rate"
        :min="0"
        :max="100"
      />
    </el-form-item>
    <el-form-item
      :label="t('commerce.food.rating')"
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
      :label="t('commerce.food.description')"
      prop="description"
    >
      <el-input
        v-model="form.description"
        type="textarea"
        :placeholder="t('commerce.food.descriptionPlaceholder')"
        :rows="3"
      />
    </el-form-item>
  </ConfigFormDialog>
</template>
