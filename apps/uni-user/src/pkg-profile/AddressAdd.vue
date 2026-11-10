<script setup>
/**
 * 新增与编辑共用表单。后端不存省市区，编辑不强迫用户重新选择未记录的地区。
 * 编辑保留隐藏字段，也不读取或覆盖新增草稿。
 */
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { useFormValidator } from '@/composables/ui/useFormValidator'
import { getAddressDetail } from '@/services/api/api-address'
import { useAddressStore } from '@/stores/modules/store-address'
import { useLocationStore } from '@/stores/modules/store-locations'
import { useFormDraft } from '@/utils/FormDraft'
import { addressSchema } from './addressFormSchema'
import AreaPicker from './components/AreaPicker.vue'
import FormInput from './components/FormInput.vue'

const addressStore = useAddressStore()
const locationStore = useLocationStore()
const formError = ref('')
const isLoading = ref(false)
const initialLoading = ref(true)
const pageReady = ref(false)
const isEdit = ref(false)
const addressId = ref(null)
// 未显示的坐标、性别和标签类型不能在编辑时被默认值覆盖。
const editingAddress = ref(null)
const form = reactive({
  name: '',
  region: '',
  detail: '',
  door: '',
  phone: '',
  phoneBk: '',
  sex: 1,
  tag: '常用',
  isDefault: false,
})
const schema = reactive({ ...addressSchema })
const { clearDraft, restoreDraft } = useFormDraft(form, 'address_add_draft', 30, () => !isEdit.value && pageReady.value)
const { errors, isValid, validateField, validateAll } = useFormValidator(form, schema)
const canSubmit = computed(() =>
  pageReady.value && isValid.value && form.name.trim() && form.detail.trim() && form.phone
  && (isEdit.value || form.region),
)
const tagOptions = ['常用', '家', '公司', '学校', '其他']

onLoad(async (options) => {
  isEdit.value = options?.id !== undefined
  uni.setNavigationBarTitle({ title: isEdit.value ? '编辑地址' : '新增地址' })
  try {
    if (isEdit.value) {
      const id = Number(options.id)
      if (!Number.isInteger(id) || id <= 0)
        throw new Error('地址参数无效')
      addressId.value = id
      schema.region = []
      const address = (await getAddressDetail(id)).data
      if (!address)
        throw new Error('地址详情加载失败')
      editingAddress.value = address
      Object.assign(form, {
        name: address.name,
        detail: address.address,
        door: address.addressDetail || '',
        phone: address.phone,
        phoneBk: address.phoneBk || '',
        sex: address.sex,
        tag: address.tag,
        isDefault: address.isDefault,
      })
      pageReady.value = true
    }
    else {
      const loaded = await addressStore.loadAddresses()
      if (!loaded)
        throw new Error('地址列表加载失败，请返回重试')
      pageReady.value = true
      if (!restoreDraft())
        form.isDefault = addressStore.AddressList.length === 0
    }
  }
  catch (error) {
    formError.value = error?.message || '加载失败，请返回重试'
  }
  finally {
    initialLoading.value = false
  }
})

function toApiPayload() {
  return {
    name: form.name.trim(),
    address: form.detail.trim(),
    addressDetail: form.door || '',
    phone: form.phone,
    phoneBk: form.phoneBk || undefined,
    sex: form.sex,
    tag: form.tag,
    tagType: editingAddress.value?.tagType ?? 2,
    poiType: editingAddress.value?.poiType ?? 0,
    geohash: isEdit.value ? editingAddress.value.geohash : locationStore.geohash || '',
    isDefault: form.isDefault,
  }
}

async function handleSubmit() {
  // 页面还没加载完或已有请求时，不能再次保存；按钮变灰并不能挡住所有回调。
  if (!pageReady.value || isLoading.value)
    return
  if (!validateAll()) {
    formError.value = '请正确填写所有必填项'
    return
  }
  isLoading.value = true
  formError.value = ''
  try {
    await addressStore.saveAddress(addressId.value, toApiPayload())
    if (!isEdit.value)
      clearDraft()
    uni.navigateBack()
  }
  catch (error) {
    formError.value = error?.message || '保存失败，请重试'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <view class="address-add">
    <view v-if="initialLoading" class="loading-state">
      加载地址中...
    </view>
    <view v-else class="form">
      <FormInput v-model="form.name" type="text" label="姓名" placeholder="输入姓名" name="name" :error="errors.name" @field-change="validateField('name')" @field-blur="validateField('name')" />
      <view class="form-item">
        <text class="form-item_label">
          所在地区{{ isEdit ? '（选填，原地址未记录）' : '' }}
        </text>
        <AreaPicker v-model="form.region" placeholder="所在地区" />
        <text v-if="errors.region" class="field-error">
          {{ errors.region }}
        </text>
      </view>
      <FormInput v-model="form.detail" type="text" label="详细地址" placeholder="街道/小区/楼栋，如 桂平路180号33幢" name="detail" :error="errors.detail" @field-change="validateField('detail')" @field-blur="validateField('detail')" />
      <FormInput v-model="form.door" type="text" label="门牌号" placeholder="如 A座101室" name="door" optional :error="errors.door" @field-change="validateField('door')" />
      <FormInput v-model="form.phone" type="number" label="手机号" placeholder="手机号" :maxlength="11" name="phone" :error="errors.phone" @field-change="validateField('phone')" @field-blur="validateField('phone')" />
      <FormInput v-model="form.phoneBk" type="number" label="备用电话" placeholder="选填" :maxlength="11" name="phoneBk" optional :error="errors.phoneBk" @field-blur="validateField('phoneBk')" />
      <view class="form-item">
        <text class="form-item_label">
          标签（选填）
        </text>
        <view class="tag-group">
          <view v-for="opt in tagOptions" :key="opt" class="tag-option" :class="{ active: form.tag === opt }" @click="form.tag = opt">
            {{ opt }}
          </view>
        </view>
      </view>
      <view class="form-item default-row">
        <text class="form-item_label">
          设为默认地址
        </text>
        <switch class="default-switch" :checked="form.isDefault" color="#1890ff" @change="form.isDefault = $event.detail.value" />
      </view>
      <view v-if="formError" class="form-error">
        {{ formError }}
      </view>
      <button class="submit-btn" :class="{ 'submit-btn_disabled': !canSubmit || isLoading }" :disabled="!canSubmit || isLoading" @click="handleSubmit">
        {{ isLoading ? '提交中...' : '保存地址' }}
      </button>
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

.loading-state {
  padding: 48rpx;
  color: #999;
  text-align: center;
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
  padding: 0;
  margin: 48rpx auto 0;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 96rpx;
  color: #fff;
  text-align: center;
  background: #1890ff;
  border-radius: 16rpx;

  &::after {
    border: 0;
  }

  &:active {
    background: #096dd9;
  }

  &_disabled {
    background: #bae7ff;
    opacity: 0.7;
  }
}

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

.field-error {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #ff4d4f;
}

.default-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.default-row .form-item_label {
  margin-bottom: 0;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-option {
  padding: 8rpx 28rpx;
  font-size: 26rpx;
  color: #666;
  background: #f8f9fa;
  border: 2rpx solid #e9ecef;
  border-radius: 28rpx;

  &.active {
    font-weight: 500;
    color: #1890ff;
    background: #e6f7ff;
    border-color: #1890ff;
  }
}
</style>
