<template>
  <Menu />

  <div class="container">
    <router-view v-slot="{ Component }">
      <transition name="page">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import Menu from "./components/Menu.vue";
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px;
  min-height: calc(100vh - 60px);
}

@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}

/* 页面过渡动画 —— 用 transition 而非 animation，更可靠 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
