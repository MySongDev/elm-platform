<script setup>
import { areaList } from '@vant/area-data'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useFormValidator } from '@/composables/ui'
import { addAddress } from '@/services/api/api-address'
import { useLocationStore } from '@/stores/modules/store-locations'
import { useUserStore } from '@/stores/modules/store-user'
import { useFormDraft } from '@/utils/FormDraft'

import { addressSchema } from './addressFormSchema'
import FormInput from './components/FormInput.vue'
import SexSelector from './components/SexSelector.vue'

defineOptions({
  name: 'AddressAdd',
})

const router = useRouter()
const userStore = useUserStore()
const locationStore = useLocationStore()

const showArea = ref(false)
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

const { clearDraft } = useFormDraft(form)

const {
  errors,
  isValid,
  validateField,
  validateAll,
  scrollToFirstError,
} = useFormValidator(form, addressSchema)

const canSubmit = computed(() =>
  isValid.value && form.name && form.community && form.detail && form.phone,
)

function onAreaConfirm({ selectedOptions }) {
  form.detail = selectedOptions.map(item => item.text).join('/')
  validateField('detail')
  showArea.value = false
}

function toApiPayload() {
  return {
    user_id: userStore.userId,
    sex: form.sex,
    name: form.name,
    address: form.community,
    address_detail: form.detail,
    phone: form.phone,
    phone_bk: form.phoneBk || undefined,
    geohash: locationStore.geohash || '',
  }
}

async function handleSubmit() {
  if (!validateAll()) {
    formError.value = '请正确填写所有必填项'
    scrollToFirstError()
    return
  }

  isLoading.value = true
  formError.value = ''

  try {
    await addAddress(toApiPayload())
    clearDraft()
    router.back()
  }
  catch (error) {
    formError.value = error.message || '添加失败，请重试'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="address-add">
    <form class="form" @submit.prevent="handleSubmit">
      <FormInput
        v-model="form.name" type="text" label="姓名" placeholder="输入姓名" name="name"
        :error="errors.name" @field-change="validateField('name')" @field-blur="validateField('name')"
      />

      <SexSelector v-model="form.sex" :error="errors.sex" @field-change="validateField('sex')" />

      <FormInput
        v-model="form.detail" inputmode="none" label="所在地区" placeholder="所在地区" name="detail"
        :error="errors.detail" @field-change="validateField('detail')" @click="showArea = true"
      />
      <van-popup v-model:show="showArea" destroy-on-close position="bottom">
        <van-area :area-list="areaList" @confirm="onAreaConfirm" @cancel="showArea = false" />
      </van-popup>

      <FormInput
        v-model="form.community" type="text" label="小区" placeholder="小区" name="community"
        :error="errors.community" @field-change="validateField('community')" @field-blur="validateField('community')"
      />

      <FormInput
        v-model="form.phone" type="tel" label="手机号" placeholder="手机号" :maxlength="11" name="phone"
        :error="errors.phone" @field-change="validateField('phone')" @field-blur="validateField('phone')"
      />

      <FormInput
        v-model="form.phoneBk" type="tel" label="备用电话" placeholder="选填" :maxlength="11" name="phoneBk"
        optional :error="errors.phoneBk" @field-blur="validateField('phoneBk')"
      />

      <transition name="fade">
        <div v-if="formError" class="form-error">
          {{ formError }}
        </div>
      </transition>

      <button type="submit" class="submit-btn" :disabled="!canSubmit || isLoading">
        {{ isLoading ? '提交中...' : '新增地址' }}
      </button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.address-add {
  min-height: 100vh;
  background: #f5f5f5;
}

.form {
  padding: 10px 0;
}

.form-error {
  padding: 10px 16px;
  margin: 0 16px 16px;
  font-size: 14px;
  color: #ff4d4f;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.submit-btn {
  display: block;
  width: 95%;
  height: 48px;
  margin: 24px auto 0;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: #1890ff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 0 rgb(0 0 0 / 4.5%);
  transition: all 0.3s;

  &:active:not(:disabled) {
    background: #096dd9;
    box-shadow: none;
    transform: translateY(1px);
  }

  &:disabled {
    cursor: not-allowed;
    background: #bae7ff;
    opacity: 0.7;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
