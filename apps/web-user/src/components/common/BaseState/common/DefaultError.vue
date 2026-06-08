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
  padding: 4px 10px;
  margin-top: 8px;
  color: #fff;
  background: #fb7299;
  border: none;
  border-radius: 4px;
}
</style>
