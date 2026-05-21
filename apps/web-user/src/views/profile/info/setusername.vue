<script setup>
import { computed, ref, watch } from 'vue'

import { useUserStore } from '@/stores/modules/store-user'

const { updateUserName } = useUserStore()
const username = ref('')
const hasInput = ref(false)

// 是否合法
const isValid = computed(() => {
  const len = username.value.trim().length
  return len >= 5 && len <= 24
})

// 是否显示错误
const showError = computed(() => {
  return hasInput.value && !isValid.value
})

// 监听输入（只做状态标记）
watch(username, () => {
  hasInput.value = true
})

function resetName() {
  if (!isValid.value)
    return
  console.log('提交用户名：', username.value)
  updateUserName(username.value)
}
</script>

<template>
  <div>
    <section class="setname">
      <section class="setname-top">
        <input v-model="username" type="text" placeholder="输入用户名" :class="{ 'setname-input': showError }">

        <div>
          <p v-if="!hasInput">
            用户名只能修改一次（5-24字符之间）
          </p>
          <p v-else :class="{ unlikep: showError }">
            用户名长度在5到24位之间
          </p>
        </div>
      </section>

      <section class="reset">
        <button :class="{ fontopacity: !isValid }" :disabled="!isValid" @click="resetName">
          确认修改
        </button>
      </section>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.setname {
  padding: 0 15px;
}

.setname-top {
  input {
    display: block;
    width: 100%;
    height: 40px;
    margin: 10px auto;
    padding: 4.5px 2.3px;
    background: transparent;
    border: 1px solid #ddd;

    &::placeholder {
      font-size: 16px;
    }
  }

  .setname-input {
    border: 1px solid red;
  }

  p {
    font-size: 14px;
  }

  .unlikep {
    color: red;
  }

}

.reset {
  width: 100%;
  margin-top: 15px;
  background: $blue;
  text-align: center;
  line-height: 47px;

  button {
    color: $ff;
    font-size: 16.5px;
    background: none;
  }
}

.fontopacity {
  opacity: .7;
}
</style>
