<script setup>
defineProps({
  label: String,
  error: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="form-item" :class="{ 'has-error': error }">
    <label v-if="label" class="form-item_label">{{ label }}</label>
    <div class="form-item_body">
      <slot />
    </div>
    <transition name="slide">
      <div v-if="error" class="form-item_error">
{{ error }}
</div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.form-item {
  padding: 12px 16px;
  margin-bottom: 2px;
  background: #fff;
  border: 1px solid transparent;
  transition: all 0.3s;

  &.has-error {
    background: #fff2f0;
    border-color: #ff4d4f;
  }

  &_label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #666;
  }

  &_body {
    position: relative;
  }

  &_error {
    padding-left: 4px;
    margin-top: 8px;
    font-size: 12px;
    color: #ff4d4f;
  }
}

.slide-enter-active,
.slide-leave-active {
  max-height: 30px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
