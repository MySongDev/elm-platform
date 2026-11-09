<script setup lang="ts">
defineOptions({ name: 'SidebarLogo' })

defineProps<{
  collapse: boolean
}>()
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link :key="collapse ? 'collapse' : 'expand'" class="sidebar-logo-link" to="/">
        <span class="sidebar-title">{{ collapse ? 'EA' : 'Elm Admin' }}</span>
      </router-link>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  overflow: hidden;
  background-color: #002140;

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 10px;
    text-decoration: none;

    .sidebar-title {
      display: inline-block;
      max-width: 100%;
      height: 32px;
      overflow: hidden;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: #fff;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.sidebar-logo-container.collapses {
  .sidebar-logo-link {
    padding: 0;
  }

  .sidebar-title {
    font-size: 16px;
  }
}

.sidebarLogoFade-enter-active {
  transition: opacity 0.3s ease;
  transition-delay: 0.15s;
}

.sidebarLogoFade-leave-active {
  transition: opacity 0.2s ease;
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
  opacity: 0;
}
</style>
