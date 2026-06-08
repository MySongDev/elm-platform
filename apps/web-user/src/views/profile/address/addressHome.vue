<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useAddressDisplay } from '@/composables/features/address'
import { useAddressStore } from '@/stores/modules/store-address'

defineOptions({
  name: 'AddressHome',
})

const router = useRouter()
const addressStore = useAddressStore()
const { AddressList } = storeToRefs(addressStore)
const { loadAddresses } = addressStore
const {
  displayAddresses,
  getAddressTitle,
  getContactName,
  getContactGender,
  getContactPhone,
} = useAddressDisplay(AddressList)

function goAddAddress() {
  router.push('/profile/address/add')
}

function goEditAddress(item) {
  router.push({
    path: '/profile/address/add',
    query: { id: item.id },
  })
}

loadAddresses()
</script>

<template>
  <section class="address-page">
    <head-top head-title="收货地址" theme="light" class="address-head">
      <template #edit>
        <button class="add-button" type="button" @click="goAddAddress">
          新增地址
        </button>
      </template>
    </head-top>

    <ul class="address-list">
      <li v-for="item in displayAddresses" :key="item.id" class="address-item">
        <div class="address-info">
          <h2>{{ getAddressTitle(item) }}</h2>
          <p>
            <span>{{ getContactName(item) }}</span>
            <span>{{ getContactGender(item) }}</span>
            <span>{{ getContactPhone(item) }}</span>
          </p>
        </div>
        <button class="edit-button" type="button" aria-label="编辑地址" @click="goEditAddress(item)">
          <van-icon name="edit" />
        </button>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.address-page {
  min-height: 100%;
  color: #222;
  background: #fff;
}

// :deep(#head_top.address-head) {
//   height: 88px;
//   padding: 22px 18px 0;
// }

.add-button {
  padding: 8px 0;
  font-size: 15px;
  color: #222;
  white-space: nowrap;
  background: transparent;
  border: 0;
}

.address-list {
  padding: 14px 18px 0;
}

.address-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  align-items: center;
  min-height: 91px;
  border-bottom: 1px solid #e9e9e9;
}

.address-info {
  min-width: 0;

  h2 {
    @include text-ellipsis;

    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 500;
    line-height: 1.25;
    color: #222;
  }

  p {
    display: flex;
    gap: 20px;
    font-size: 14px;
    line-height: 1.2;
    color: #999;
  }
}

.edit-button {
  display: grid;
  place-items: center;
  justify-self: end;
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: #888;
  background: transparent;
  border: 0;
}
</style>
