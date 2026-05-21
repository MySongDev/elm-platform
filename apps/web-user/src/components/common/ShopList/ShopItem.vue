<script setup>
import SmartImage from '@/components/common/SmartImage.vue'
import StarRating from '@/components/common/StarRating.vue'
import { IMAGE_BASE_URL } from '@/config'
import { IMAGE_PRIORITY } from '@/config/imageLoading'
/**
 * 遵循 Vue 3.5+ 规范，解构 props 保持响应性
 * 基础原理：单数组件只做一件事情。
 */
const {
  item,
  imgBaseUrl = IMAGE_BASE_URL,
  // geohash,
} = defineProps({
  item: { type: Object, required: true },
  imgBaseUrl: String,
  geohash: String,
})

const emit = defineEmits(['click'])

// const router = useRouter()

// 优化后：减少响应式开销，改用编程式导航
function navToShop() {
  emit('click', item)
  // router.push({
  //   path: '/shop',
  //   query: { geohash, shopid: item.id },
  // })
}
// 封装跳转路径，增强可读性
// const shopUrl = computed(() => ({
//   path: '/shop',
//   query: { geohash, shopid: item.id },
// }))

// function handleItemClick(navigate) {
//   emit('click', item)
//   navigate()
// }
</script>

<template>
  <!-- <router-link v-slot="{ navigate }" :to="shopUrl" custom> -->
  <li class="shopping-item" @click="navToShop">
    <!-- @click="handleItemClick(navigate)" -->
    <SmartImage
      :src="imgBaseUrl + item.image_path"
      :alt="item.name"
      class="item-img"
      :priority="IMAGE_PRIORITY.NORMAL"
    />
    <div class="shop-item_right">
      <div class="shop-detail_header">
        <h4 class="shop-detail_name">
          {{ item.name }}
        </h4>
        <div class="shop-detail_supports">
          <span v-for="(support, idx) in item.supports" :key="idx" class="shop-detail_supported-methods">
            {{ support.icon_name }}
          </span>
        </div>
      </div>

      <div class="shop-item_center-content">
        <div class="rating">
          <StarRating :model-value="item.rating" />
          <span class="monthly_sales">月售{{ item.recent_order_num }}单</span>
        </div>
        <div class="delivery-methods">
          <span v-if="item.delivery_mode" class="delivery_span span-bg-blue">
            {{ item.delivery_mode.text }}
          </span>
          <span class="delivery_span span-bg-white">准时达</span>
        </div>
      </div>

      <div class="fee-distance">
        <p class="fee">
          ¥{{ item.float_minimum_order_amount }}元起送/{{ item.piecewise_agent_fee?.tips }}
        </p>
        <p class="distance">
          {{ item.distance }}/<span>{{ item.order_lead_time }}</span>
        </p>
      </div>
    </div>
  </li>
  <!-- </router-link> -->
</template>

<style lang="scss" scoped>
.shopping-item {
  display: flex;
  align-items: center;
  padding: 16.5px 9.3px;
  border-bottom: 0.5px solid #e2e2e2;
  background: #fff;

  &:active {
    background: #f5f5f5;
  }

  .item-img {
    width: 64px;
    height: 64px;
    margin-right: 10px;
    border-radius: 4px;
    object-fit: cover;
  }
}

.shop-item_right {
  flex: 1;
  min-width: 0;
  font-size: 12px;
}

.shop-detail_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .shop-detail_name {
    flex: 1;
    @include text-ellipsis();
    font-size: 16px;
    font-weight: 700;

    &::before {
      content: '品牌';
      background: #ffd930;
      margin-right: 8px;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  .shop-detail_supports {
    display: flex;
    gap: 4px;
  }

  .shop-detail_supported-methods {
    color: #999;
    border: 0.6px solid #f1f1f1;
    padding: 0 2px;
    border-radius: 2px;
    font-size: 10px;
  }
}

.shop-item_center-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .rating {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .monthly_sales {
    color: #666;
  }

  .delivery-methods {
    display: flex;
    gap: 4px;
    transform: scale(0.85);
    transform-origin: right center;
  }

  .delivery_span {
    padding: 1px 4px;
    border: 0.6px solid $blue;
    border-radius: 2px;
    font-size: 10px;
    white-space: nowrap;
  }

  .span-bg-blue {
    background: $blue;
    color: #fff;
  }

  .span-bg-white {
    background: #fff;
    color: $blue;
  }
}

.fee-distance {
  display: flex;
  justify-content: space-between;
  font-size: 12px;

  .fee {
    color: #666;
  }

  .distance {
    color: #999;

    span {
      color: $blue;
    }
  }
}
</style>
