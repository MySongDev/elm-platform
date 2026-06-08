<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  maxlength: {
    type: [Number, String],
    default: undefined,
  },
  inputmode: {
    type: String,
    default: undefined,
  },
  pattern: {
    type: String,
    default: undefined,
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
})

const emit = defineEmits(['input'])

const model = defineModel({
  type: String,
  default: '',
})

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
  @include flex-center($justify: flex-start);
  @include wh(100%, 45px);

  position: relative;
  padding: 12px;

  &::after {
    @include wh(100%, 1px);

    position: absolute;
    bottom: 0;
    left: 0;
    content: '';
    background: #e3e5e7;
    transform: scaleY(0.5);
    transform-origin: 0 0;
  }

  .form-label {
    min-width: 60px;
    margin-right: 12px;
    font-size: 14px;
    color: #18191c;
    text-align: right;
  }

  .form-input {
    flex: 1;
    min-width: 0;

    &::placeholder {
      font-size: 12px;
      color: #505050;
    }
  }
}
</style>
