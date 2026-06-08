<script setup lang="ts">
import { DataScopeHint } from '@/entities/session'
import { RestaurantManagementPage } from '@/features/restaurant-management'

defineOptions({ name: 'CommerceRestaurantView' })
</script>

<template>
  <div>
    <DataScopeHint />
    <RestaurantManagementPage />
  </div>
</template>
