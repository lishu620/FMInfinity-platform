<template>
  <div class="page-container">
    <h1 class="page-title">快速开始</h1>
    <el-divider />

    <div>
      <!-- 公共模块 -->

      <h2>公共模块</h2>
      <br />
      <div class="page-list">
        <div class="page-item" @click="GoPage('/vote')">
          <h2>稿件投票</h2>
          <div>投票播客稿件</div>
        </div>
        <div class="page-item" @click="GoPage('/submission-status')">
          <h2>稿件状态</h2>
          <div>查看稿件状态</div>
        </div>
        <!-- 可根据需要继续添加卡片，它们会自动换行 -->
      </div>
      <el-divider />
    </div>

    <div>
      <!-- 文案组功能区域 -->
      <h2>文案组</h2>
      <br />
      <div class="page-list">
        <div class="page-item" @click="GoPage('/issues')">
          <h2>稿件管理</h2>
          <div>创建、编辑、管理播客稿件</div>
          <div>支持歌单导入、内部推荐</div>
        </div>
        <div class="page-item" @click="GoPage('/review')">
          <h2>稿件查看 / 文案编辑</h2>
          <div>查看稿件并填写文案</div>
        </div>
        <!-- 可根据需要继续添加卡片，它们会自动换行 -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const GoPage = (path) => {
  router.push(path);
};
</script>

<style scoped>
.page-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.page-item {
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.page-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.8);
}
</style>
