<template>
  <Menu />

  <div class="container">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
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

/* 页面过渡动画 */
.page-enter-active {
  animation: pageEnter 0.35s cubic-bezier(0.19, 1, 0.22, 1) both;
}

.page-leave-active {
  animation: pageLeave 0.2s ease both;
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageLeave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.98);
  }
}
</style>
