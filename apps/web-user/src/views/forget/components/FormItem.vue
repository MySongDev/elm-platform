<script setup>
defineProps({
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  name: { type: String, required: true },
  maxlength: { type: [Number, String], default: undefined },
  inputmode: { type: String, default: undefined },
  pattern: { type: String, default: undefined },
  autocomplete: { type: String, default: 'off' },
})

const emit = defineEmits(['input'])

const model = defineModel({ type: String, default: '' })

function handleInput(e) {
  emit('input', e)
}
</script>

<template>
  <div class="form-item">
    <label class="form-label" :for="name">
      {{ label }}
    </label>
    <input
      :id="name"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :name="name"
      :maxlength="maxlength"
      :inputmode="inputmode"
      :pattern="pattern"
      :autocomplete="autocomplete"
      class="form-input"
      @input="handleInput"
    >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.form-item {
  position: relative;
  @include flex-center($justify: flex-start);

  @include wh(100%, 45px);
  padding: 12px;

  &::after {
    content: '';
    @include wh(100%, 1px);
    position: absolute;
    left: 0;
    bottom: 0;
    transform: scaleY(0.5);
    transform-origin: 0 0;
    background: #e3e5e7;
  }

  .form-label {
    min-width: 60px;
    margin-right: 12px;
    color: #18191c;
    font-size: 14px;
    text-align: right;
  }

  .form-input {
    flex: 1;
    min-width: 0;

    &::placeholder {
      color: #505050;
      font-size: 12px;
    }
  }
}
</style>
