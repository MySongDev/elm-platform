<script setup>
import SkeletonBlock from '@/components/common/Skeleton/SkeletonBlock.vue'
</script>

<template>
  <div class="shop-page-skeleton" aria-hidden="true">
    <section class="shop-skeleton-header">
      <div class="shop-skeleton-nav">
        <SkeletonBlock width="32px" height="32px" circle />
        <SkeletonBlock width="32px" height="32px" circle />
      </div>
      <div class="shop-skeleton-hero">
        <SkeletonBlock width="72px" height="72px" radius="8px" />
        <div class="shop-skeleton-info">
          <SkeletonBlock width="58%" height="22px" />
          <SkeletonBlock width="76%" height="14px" />
          <SkeletonBlock width="48%" height="14px" />
        </div>
      </div>
      <div class="shop-skeleton-coupon">
        <SkeletonBlock width="64%" height="18px" />
        <SkeletonBlock width="54px" height="18px" />
      </div>
    </section>

    <nav class="shop-skeleton-tabs">
      <SkeletonBlock width="48px" height="18px" />
      <SkeletonBlock width="48px" height="18px" />
    </nav>

    <section class="shop-skeleton-content">
      <aside class="shop-skeleton-side">
        <SkeletonBlock v-for="index in 8" :key="index" width="58px" height="18px" />
      </aside>

      <main class="shop-skeleton-main">
        <div v-for="index in 6" :key="index" class="shop-skeleton-food">
          <SkeletonBlock width="72px" height="72px" radius="8px" />
          <div class="shop-skeleton-food__body">
            <SkeletonBlock width="62%" height="18px" />
            <SkeletonBlock width="88%" height="13px" />
            <SkeletonBlock width="48%" height="13px" />
            <div class="shop-skeleton-food__footer">
              <SkeletonBlock width="52px" height="18px" />
              <SkeletonBlock width="28px" height="28px" circle />
            </div>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<style scoped>
.shop-page-skeleton {
  min-height: 100vh;
  background: #f6f6f6;
}

.shop-skeleton-header {
  padding: 14px 12px 12px;
  background: #fff;
}

.shop-skeleton-nav,
.shop-skeleton-hero,
.shop-skeleton-coupon,
.shop-skeleton-tabs,
.shop-skeleton-content,
.shop-skeleton-food,
.shop-skeleton-food__footer {
  display: flex;
}

.shop-skeleton-nav,
.shop-skeleton-coupon,
.shop-skeleton-tabs,
.shop-skeleton-food__footer {
  align-items: center;
  justify-content: space-between;
}

.shop-skeleton-nav {
  margin-bottom: 16px;
}

.shop-skeleton-hero {
  gap: 12px;
}

.shop-skeleton-info,
.shop-skeleton-food__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.shop-skeleton-coupon {
  padding: 10px;
  margin-top: 14px;
  background: #fafafa;
  border-radius: 6px;
}

.shop-skeleton-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 42px;
  padding: 0 72px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.shop-skeleton-content {
  align-items: flex-start;
  background: #fff;
}

.shop-skeleton-side {
  display: flex;
  flex: 0 0 82px;
  flex-direction: column;
  gap: 24px;
  width: 82px;
  padding: 18px 12px;
  background: #f8f8f8;
}

.shop-skeleton-main {
  flex: 1;
  min-width: 0;
  background: #fff;
}

.shop-skeleton-food {
  gap: 10px;
  padding: 14px 12px;
  border-bottom: 1px solid #f2f2f2;
}
</style>
