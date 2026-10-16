<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/add/AddressAdd.vue 同源改造。
 * 整体替换占位页（Batch 3 profile 组，@vant/area-data 是本分包必须单独分仓的原因）。
 *
 * 差异：
 * 1. 编辑模式：web-user 原文**只有「新增」逻辑**（读不到 query.id 也当新增处理，
 *    onLoad 里没有预填 query.id 对应地址），uni-user 保持同源行为 —— 编辑功能
 *    目前后端接口只有 `addAddress`，没有 `updateAddress`，编辑暂不支持，
 *    从 addressHome 点「编辑」进来实际仍是走新增表单（这是 web-user 侧的既有行为，
 *    不属于迁移引入的回归；若后续要真做编辑，需要后端补 PUT /customer-addresses/:id
 *    接口，另立任务）
 * 2. `van-popup` + `van-area` → 小程序端用自研 `AreaPicker`（原生 multiSelector
 *    picker 封装，见 components/AreaPicker.vue 头部说明）
 * 3. `useFormValidator.scrollToFirstError()` → 小程序端无 DOM，退化为返回首个出错
 *    字段名（见 composables/ui/useFormValidator.js 头部说明）；本页没有调用它
 * 4. `<form @submit.prevent>` → `view` + 提交按钮 `@click`（小程序无 form submit）
 * 5. `<transition name="fade">` 里的错误提示 → 直接用 `v-if`（小程序对 transition
 *    组件支持有限，动画非必需，去掉）
 * 6. `useFormDraft` 走 platform/storage（已在本仓收口，见 utils/FormDraft.js）
 * 7. 页面标题：`新增地址`（与 pages.json 的 navigationBarTitleText 一致）
 * 8. 编辑模式：web-user 原文**只有「新增」逻辑**（读不到 query.id 也当新增处理，
 *    onLoad 里没有预填 query.id 对应地址）；uni-user 保持同源行为。
 *    后端接口目前只有 `addAddress`，没有 `updateAddress`，「编辑」暂不支持，
 *    从 addressHome 点「编辑」进来实际仍走新增表单（web-user 侧的既有行为，
 *    不是迁移引入的回归；要真做编辑需后端补 PUT /customer-addresses/:id，另立任务）
 */
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'

import { useFormValidator } from '@/composables/ui/useFormValidator'
import { addAddress } from '@/services/api/api-address'
import { useLocationStore } from '@/stores/modules/store-locations'
import { useFormDraft } from '@/utils/FormDraft'

import { addressSchema } from './addressFormSchema'
import AreaPicker from './components/AreaPicker.vue'
import FormInput from './components/FormInput.vue'
import SexSelector from './components/SexSelector.vue'

const locationStore = useLocationStore()

const formError = ref('')
const isLoading = ref(false)

const form = reactive({
  name: '',
  community: '',
  detail: '',
  phone: '',
  phoneBk: '',
  sex: 1,
})

const { clearDraft } = useFormDraft(form, 'address_add_draft')

const {
  errors,
  isValid,
  validateField,
  validateAll,
} = useFormValidator(form, addressSchema)

const canSubmit = computed(() =>
  isValid.value && form.name && form.community && form.detail && form.phone,
)

onLoad((options) => {
  // query.id 目前未使用（编辑模式暂不支持，见头部差异说明 1），
  // 保留 onLoad 钩子以便将来接后端 updateAddress 时预填
  console.log('[AddressAdd] onLoad', options)
})

function toApiPayload() {
  return {
    sex: form.sex,
    name: form.name,
    address: form.community,
    addressDetail: form.detail,
    phone: form.phone,
    phoneBk: form.phoneBk || undefined,
    geohash: locationStore.geohash || undefined,
  }
}

async function handleSubmit() {
  if (!validateAll()) {
    formError.value = '请正确填写所有必填项'
    return
  }

  isLoading.value = true
  formError.value = ''

  try {
    await addAddress(toApiPayload())
    clearDraft()
    uni.navigateBack()
  }
  catch (error) {
    formError.value = error?.message || '添加失败，请重试'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <view class="address-add">
    <view class="form" @click="() => {}">
      <FormInput
        v-model="form.name"
        type="text"
        label="姓名"
        placeholder="输入姓名"
        name="name"
        :error="errors.name"
        @field-change="validateField('name')"
        @field-blur="validateField('name')"
      />

      <SexSelector
        v-model="form.sex"
        :error="errors.sex"
        @field-change="validateField('sex')"
      />

      <view class="form-item">
        <text class="form-item_label">
          所在地区
        </text>
        <AreaPicker v-model="form.detail" placeholder="所在地区" />
      </view>

      <FormInput
        v-model="form.community"
        type="text"
        label="小区"
        placeholder="小区"
        name="community"
        :error="errors.community"
        @field-change="validateField('community')"
        @field-blur="validateField('community')"
      />

      <FormInput
        v-model="form.phone"
        type="number"
        label="手机号"
        placeholder="手机号"
        :maxlength="11"
        name="phone"
        :error="errors.phone"
        @field-change="validateField('phone')"
        @field-blur="validateField('phone')"
      />

      <FormInput
        v-model="form.phoneBk"
        type="number"
        label="备用电话"
        placeholder="选填"
        :maxlength="11"
        name="phoneBk"
        optional
        :error="errors.phoneBk"
        @field-blur="validateField('phoneBk')"
      />

      <view v-if="formError" class="form-error">
        {{ formError }}
      </view>

      <view
        class="submit-btn"
        :class="{ 'submit-btn_disabled': !canSubmit || isLoading }"
        @click="handleSubmit"
      >
        {{ isLoading ? '提交中...' : '新增地址' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.address-add {
  min-height: 100vh;
  background: #f5f5f5;
}

.form {
  padding: 20rpx 0;
}

.form-error {
  padding: 20rpx 32rpx;
  margin: 0 32rpx 32rpx;
  font-size: 28rpx;
  color: #ff4d4f;
  background: #fff2f0;
  border: 2rpx solid #ffccc7;
  border-radius: 12rpx;
}

.submit-btn {
  display: block;
  width: 95%;
  height: 96rpx;
  margin: 48rpx auto 0;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 96rpx;
  color: #fff;
  text-align: center;
  background: #1890ff;
  border-radius: 16rpx;
  transition: all 0.3s;

  &:active {
    background: #096dd9;
    transform: translateY(2rpx);
  }

  &_disabled {
    background: #bae7ff;
    opacity: 0.7;
  }
}

/* 与 FormInput 的 label 视觉对齐（AreaPicker 没有内置 label，外面包一层） */
.form-item {
  padding: 24rpx 32rpx;
  margin-bottom: 4rpx;
  background: #fff;

  &_label {
    display: block;
    margin-bottom: 16rpx;
    font-size: 28rpx;
    color: #666;
  }
}
</style>
