<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="info-data">
    <ul class="info-data_list">
      <router-link v-for="item in items" :key="item.to" v-slot="{ navigate }" :to="item.to" custom>
        <li class="info-data_item" @click="navigate">
          <span class="info-data_item_top">
            <b :style="{ color: item.color }">{{ item.value }}</b>{{ item.unit }}
          </span>
          <span class="info-data_item_bottom">{{ item.label }}</span>
        </li>
      </router-link>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.info-data {
  width: 100%;
  height: 87px;
  background: $ff;

  &_list {
    display: flex;
  }

  &_item {
    height: 87px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid $e4;
    text-align: center;

    &_top {
      font-size: 12px;

      b {
        font-size: 28px;
        font-weight: 700;
      }
    }

    &_bottom {
      font-size: 14px;
      color: #666;
      margin-top: 6px;
    }

    &:last-child {
      border-right: none;
    }
  }
}
</style>
