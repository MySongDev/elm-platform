<template>
  <div class="error">
    <p>加载失败</p>
    <button @click="$emit('retry')">
      重试
    </button>
  </div>
</template>

<style scoped>
.error {
  text-align: center;
}

button {
  margin-top: 8px;
  padding: 4px 10px;
  border: none;
  background: #fb7299;
  color: #fff;
  border-radius: 4px;
}
</style>
