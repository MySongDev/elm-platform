<script setup>
import SkeletonBlock from './SkeletonBlock.vue'

defineProps({
  rows: { type: Number, default: 6 },
})
</script>

<template>
  <ul class="shop-list-skeleton" aria-hidden="true">
    <li v-for="index in rows" :key="index" class="shop-skeleton-item">
      <SkeletonBlock width="64px" height="64px" radius="4px" class="shop-skeleton-item__avatar" />
      <div class="shop-skeleton-item__content">
        <div class="shop-skeleton-item__header">
          <SkeletonBlock width="46%" height="18px" />
          <SkeletonBlock width="52px" height="16px" radius="3px" />
        </div>
        <div class="shop-skeleton-item__row">
          <SkeletonBlock width="120px" height="14px" />
          <SkeletonBlock width="72px" height="18px" radius="3px" />
        </div>
        <div class="shop-skeleton-item__row">
          <SkeletonBlock width="150px" height="14px" />
          <SkeletonBlock width="78px" height="14px" />
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.shop-list-skeleton {
  background: #fff;
}

.shop-skeleton-item {
  display: flex;
  padding: 16.5px 9.3px;
  border-bottom: 0.5px solid #e2e2e2;
}

.shop-skeleton-item__avatar {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  margin-right: 10px;
  border-radius: 4px;
}

.shop-skeleton-item__content {
  flex: 1;
  min-width: 0;
}

.shop-skeleton-item__header,
.shop-skeleton-item__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shop-skeleton-item__header {
  margin-bottom: 14px;
}

.shop-skeleton-item__row {
  margin-bottom: 12px;
}
</style>
