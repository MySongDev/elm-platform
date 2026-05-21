<script setup>
defineProps({
  groups: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <nav
    v-for="(group, index) in groups"
    :key="index"
    class="profile-nav"
    :class="{ 'last-nav': index === groups.length - 1 }"
  >
    <router-link
      v-for="item in group"
      :key="item.to"
      :to="item.to"
      class="nav-link"
    >
      <svgIcon :icon-name="item.icon" :color="item.color" />
      <span>{{ item.title }}</span>
      <svgIcon icon-name="arrow-right" icon-class="svg-right" />
    </router-link>
  </nav>
</template>

<style lang="scss" scoped>
.profile-nav {
  margin-top: 10px;
  padding: 0 12px;
  background: $ff;

  .nav-link {
    line-height: 45px;
    display: flex;
    justify-content: start;
    align-items: center;
    border-bottom: 1px solid $e4;

    span {
      margin-left: 5px;
      flex: 1;
    }
  }

  .nav-link:last-child {
    border: none;
  }
}

.last-nav {
  height: 90px;
}
</style>
