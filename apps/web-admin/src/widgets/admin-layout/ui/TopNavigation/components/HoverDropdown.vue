<script setup lang="ts">
defineOptions({ name: 'HoverDropdown' })

const emit = defineEmits<{
  command: [command: DropdownCommand]
}>()

type DropdownCommand = string | number | object

function handleCommand(command: DropdownCommand) {
  emit('command', command)
}
</script>

<template>
  <el-dropdown trigger="hover" placement="bottom-end" @command="handleCommand">
    <slot />
    <template #dropdown>
      <slot name="dropdown" />
    </template>
  </el-dropdown>
</template>
