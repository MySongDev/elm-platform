<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/cart/components/CartStoreCard.vue 同源改造。
 * 差异：section/header/div/h2/span → view/text；van-icon(arrow) → iconfont arrow-right；
 * px → rpx；④ 类 @media 整块保留 px 不转（断点是视口物理像素）；
 * ① 类不转：box-shadow 的 1px、reserve-tag/time 的 border 1px。
 */
import { computed } from 'vue'

import CartCheckButton from './CartCheckButton.vue'
import CartProductRow from './CartProductRow.vue'

const props = defineProps({
  store: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-store', 'toggle-product', 'increase', 'decrease'])

const hasDeliveryInfo = computed(() => props.store.deliveryTime || props.store.distance)
const hasReserveInfo = computed(() => props.store.reserveText || props.store.deliveryText)
</script>

<template>
  <view class="store-card">
    <view class="store-header">
      <CartCheckButton
        :checked="selected"
        :aria-label="selected ? '取消选择店铺' : '选择店铺'"
        @click="emit('toggle-store', store.id)"
      />

      <view class="store-main">
        <view class="store-line">
          <text class="store-name">
            {{ store.name }}
          </text>
          <SvgIcon
            icon-name="arrow-right"
            class="store-arrow"
          />
        </view>

        <view
          v-if="hasReserveInfo"
          class="reserve-info"
        >
          <text
            v-if="store.reserveText"
            class="reserve-tag"
          >
            {{ store.reserveText }}
          </text>
          <text
            v-if="store.deliveryText"
            class="reserve-time"
          >
            {{ store.deliveryText }}
          </text>
        </view>

        <view
          v-if="hasDeliveryInfo"
          class="delivery-info"
        >
          <text>{{ store.deliveryTime }}</text>
          <text>{{ store.distance }}</text>
        </view>
      </view>
    </view>

    <view class="product-list">
      <CartProductRow
        v-for="product in store.products"
        :key="product.id"
        :product="product"
        @toggle="emit('toggle-product', $event)"
        @increase="emit('increase', $event)"
        @decrease="emit('decrease', $event)"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.store-card {
  padding: 20rpx;
  border-radius: 36rpx;
  box-shadow: 0 1px 0 rgb(17 24 39 / 2%); /* ① 类 box-shadow 1px 不转 */
}

.store-card+.store-card {
  margin-top: 10rpx;
}

.store-header {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.store-main {
  display: flex;
  flex: 1;
  gap: 56rpx;
  align-items: center;
  min-width: 0;
}

.store-line {
  display: flex;
  align-items: center;
  min-width: 0;
}

.store-name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-arrow {
  flex: 0 0 auto;
  margin-left: 6rpx;
  font-size: 32rpx;
}

.delivery-info {
  display: inline-flex;
  gap: 16rpx;
  align-items: center;
  font-size: 26rpx;
  color: #777;
  white-space: nowrap;
}

.reserve-info {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 312rpx;
  height: 48rpx;
  font-size: 24rpx;
  color: #2397db;
  white-space: nowrap;
}

.reserve-tag,
.reserve-time {
  display: inline-flex;
  align-items: center;
  height: 44rpx;
  border: 1px solid #4db0ea; /* ① 类 border 不转 */
}

.reserve-tag {
  padding: 0 14rpx;
  color: #fff;
  background: #36a7ea;
  border-radius: 10rpx 0 0 10rpx;
}

.reserve-time {
  padding: 0 14rpx;
  background: #fff;
  border-left: 0;
  border-radius: 0 10rpx 10rpx 0;
}

.product-list {
  margin-top: 30rpx;
}

/* ⚠️ ④ 类：@media 断点是视口物理像素，整块保留 px 不转。
   小程序端该断点是否还触发需真机评估（议题 4 ④，已列入 PoC 测量清单 C4）
   ★ 位置有语义：必须留在 .store-card 等基础规则之后。
     基础规则用简写 padding，这里用长写 padding-inline；若把本块前移，
     简写会反向覆盖长写 → 小屏适配静默失效（stylelint 的 --fix 曾真这么干过） */
@media (width <= 374px) {
  .store-card {
    padding-inline: 14px;
  }

  .store-main {
    flex-wrap: wrap;
  }

  .reserve-info,
  .delivery-info {
    justify-content: flex-start;
  }
}
</style>
