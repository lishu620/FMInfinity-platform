<template>
  <Menu />

  <div class="container">
    <router-view />
  </div>
</template>

<script setup>
import Menu from "./components/Menu.vue";
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>
