<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/add/AddressDatil.vue 同源改造。
 * 整体替换占位页（Batch 3 profile 组）。
 *
 * 源页面本身就是个空壳（web-user 里只有 head-top 标题「搜索地址」，无任何业务逻辑）
 * —— web-user 侧从未实现「地址详情」的实际内容，只注册了路由与页面文件。
 *
 * 差异：
 * 1. 导航统一走原生导航栏（2026-11-07）：原蓝色 head-top（`Head` 组件，与原生栏双头）
 *    已移除，本页只剩空壳，标题由 pages.json 的 navigationBarTitleText 承担。
 * 2. 本页保持空壳行为不变（忠实迁移），后续若要做详情/搜索地址的实际功能，
 *    另立任务
 */
</script>

<template>
  <view class="address-detail-page" />
</template>

<style lang="scss" scoped>
.address-detail-page {
  min-height: 100vh;
}
</style>
