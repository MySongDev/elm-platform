<script setup>
defineProps({
  label: String,
  error: { type: String, default: '' },
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
  background: #fff;
  padding: 12px 16px;
  margin-bottom: 2px;
  border: 1px solid transparent;
  transition: all 0.3s;

  &.has-error {
    border-color: #ff4d4f;
    background: #fff2f0;
  }

  &_label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  &_body {
    position: relative;
  }

  &_error {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 8px;
    padding-left: 4px;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 30px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
