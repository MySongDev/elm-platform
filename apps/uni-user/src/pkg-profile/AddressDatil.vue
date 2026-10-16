<script setup>
/**
 * ⚠️ 与 apps/web-user/src/views/profile/address/add/AddressDatil.vue 同源改造。
 * 整体替换占位页（Batch 3 profile 组）。
 *
 * 源页面本身就是个空壳（只有 head-top 标题「搜索地址」，无任何业务逻辑）——
 * web-user 侧从未实现「地址详情」的实际内容，只注册了路由与页面文件。
 *
 * 差异：
 * 1. `head-top` 显式 import（同 addressHome 的理由，见 007 坑 15）
 * 2. 本页保持空壳行为不变（忠实迁移），后续若要做详情/搜索地址的实际功能，
 *    另立任务
 */
import Head from '@/components/header/head.vue'
</script>

<template>
  <view>
    <Head head-title="搜索地址" theme="light" />
  </view>
</template>
