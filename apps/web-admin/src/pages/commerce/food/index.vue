<script setup lang="ts">
import { DataScopeHint } from '@/entities/session'
import { FoodManagementPage } from '@/features/food-management'

defineOptions({ name: 'CommerceFoodView' })
</script>

<template>
  <div>
    <DataScopeHint />
    <FoodManagementPage />
  </div>
</template>
