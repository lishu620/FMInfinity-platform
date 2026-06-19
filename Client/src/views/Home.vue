<template>
  <div class="home-page">
    <div class="hero">
      <h1 class="hero-title">
        <span class="gradient-text">FMInfinity</span>
        <br />共鸣电台聚合一站式服务平台
      </h1>
      <p class="hero-desc">易上手、高灵活、全流程的一站式综合平台</p>
      <div class="hero-buttons">
        <el-button type="primary" size="large" @click="goIssues">
          快速开始
        </el-button>
        <el-button size="large" @click="scrollToFeatures"> 了解更多 </el-button>
      </div>
    </div>

    <!-- 卡片模块 -->
    <div id="features" class="features">
      <div class="feature-card">
        <el-icon class="feature-icon" :size="48" color="#409EFF">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </el-icon>
        <h3 class="feature-title">每次稿件</h3>
        <p class="feature-desc">
          公共提交、文案组筛选、用户投票、管理员确认，全流程可视化
        </p>
      </div>

      <div class="feature-card">
        <el-icon class="feature-icon" :size="48" color="#409EFF">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            ></path>
          </svg>
        </el-icon>
        <h3 class="feature-title">每日文案</h3>
        <p class="feature-desc">用户可自由提交每日文案</p>
      </div>

      <div class="feature-card">
        <el-icon class="feature-icon" :size="48" color="#409EFF">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
          </svg>
        </el-icon>
        <h3 class="feature-title">安全可控</h3>
        <p class="feature-desc">平台采用多安全认证机制，确保用户数据安全</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
const goIssues = () => router.push("/quick-start");
const scrollToFeatures = () => {
  document.getElementById("features").scrollIntoView({ behavior: "smooth" });
};
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 40px 16px;
  background: var(--card-bg, rgba(255, 255, 255, 0.6));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  margin: 12px;
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@media (min-width: 768px) {
  .hero {
    padding: 80px 20px;
    margin: 20px;
  }
}

.hero-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
  line-height: 1.3;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 48px;
    margin-bottom: 20px;
  }
}

.gradient-text {
  background: linear-gradient(90deg, var(--gradient-start, #409eff), var(--gradient-end, #67c23a));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% auto;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.hero-desc {
  font-size: 15px;
  color: var(--text-secondary, #606266);
  max-width: 800px;
  margin: 0 auto 30px;
  padding: 0 12px;
}

@media (min-width: 768px) {
  .hero-desc {
    font-size: 18px;
    margin: 0 auto 40px;
  }
}

.hero-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .hero-buttons {
    gap: 20px;
  }
}

.features {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .features {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin: 30px auto;
    padding: 0 20px;
  }
}

@media (min-width: 1024px) {
  .features {
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    margin: 40px auto;
  }
}

.feature-card {
  padding: 24px;
  border-radius: 12px;
  background: var(--card-bg, rgba(255, 255, 255, 0.65));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border, rgba(255, 255, 255, 0.3));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: fadeInUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.feature-card:active {
  transform: scale(0.97);
}

@media (min-width: 768px) {
  .feature-card {
    padding: 30px;
  }
}

.feature-icon {
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

@media (min-width: 768px) {
  .feature-icon {
    margin-bottom: 20px;
  }
}

.feature-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .feature-title {
    font-size: 20px;
    margin-bottom: 10px;
  }
}

.feature-desc {
  color: var(--text-secondary, #606266);
  line-height: 1.6;
  font-size: 14px;
}
</style>
