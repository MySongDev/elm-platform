<script setup>
defineProps(
  {
    title: {
      type: String,
      default: '确认操作？',
    },
    confirmText: {
      type: String,
      default: '确定',
    },
    cancelText: {
      type: String,
      default: '取消',
    },
  },
)

/**
 * ========= Emits =========
 */

const emit = defineEmits([
  // 'update:modelValue',
  'confirm',
  'cancel',
])

/**
 * ========= Props =========
 */
const model = defineModel({
  type: Boolean,
  default: false,
})

/**
 * ========= methods =========
 */
function close() {
  model.value = false
}

function handleCancel() {
  emit('cancel')
  close()
}

function handleConfirm() {
  emit('confirm')
  close()
}
</script>

<template>
  <!-- <Teleport to="body"> -->
  <Transition name="confirm-fade">
    <div v-if="model" class="overlay">
      <div class="overlay-content">
        <!-- icon slot -->
        <slot name="icon">
          <div class="icon">
            ⚠️
          </div>
        </slot>

        <!-- title -->
        <h2 class="title">
          {{ title }}
        </h2>

        <!-- actions -->
        <div class="actions">
          <button class="cancel" @click="handleCancel">
            {{ cancelText }}
          </button>

          <button class="confirm" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <!-- </Teleport> -->
</template>

<style scoped lang="scss">
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 50%);
}

.overlay-content {
  width: 90%;
  max-width: 420px;
  padding: 24px;
  text-align: center;
  background: #fff;
  border-radius: 10px;
}

.title {
  margin: 20px 0;
  font-size: 18px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;

  button {
    flex: 1;
    padding: 10px 0;
    color: #fff;
    cursor: pointer;
    border: none;
    border-radius: 6px;
  }

  .cancel {
    background: #c1c1c1;
  }

  .confirm {
    background: #dd6b55;
  }
}

/* 动画 */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity .2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
