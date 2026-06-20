<template>
  <div class="dashboard-container">
    <!-- 顶部欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <div class="banner-text">
          <h1 class="banner-title">
            {{ greeting }}，{{ authStore.user?.nickname || '用户' }}
            <span class="wave-emoji">👋</span>
          </h1>
          <p class="banner-subtitle">
            欢迎来到 FMInfinity 共鸣电台聚合一站式服务平台，快速导航到您需要的功能模块
          </p>
          <p class="banner-quote" v-if="dailyQuote.content" @click="openQuoteLink">
            <span class="quote-icon">💬</span>
            <span class="quote-text">「{{ dailyQuote.content }}」</span>
            <span v-if="dailyQuote.link" class="quote-link-hint">🔗 点击查看来源</span>
          </p>
        </div>
        <div class="banner-stats">
          <div class="stat-item">
            <el-icon :size="28" color="#409EFF"><Histogram /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ authStore.user?.group || '访客' }}</span>
              <span class="stat-label">当前身份</span>
            </div>
          </div>
          <div class="stat-item">
            <el-icon :size="28" color="#67C23A"><Calendar /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ currentDate }}</span>
              <span class="stat-label">今日日期</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 公共模块 ==================== -->
    <section class="section-block">
      <div class="section-header">
        <el-icon :size="22" color="#409EFF"><Platform /></el-icon>
        <h2 class="section-title">公共模块</h2>
        <span class="section-badge">所有用户可用</span>
      </div>
      <div class="card-grid">
        <div class="feature-card card-vote" @click="GoPage('/vote')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <div class="card-body">
            <h3>稿件投票</h3>
            <p>参与播客稿件投票，为您喜欢的歌曲助力</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-status" @click="GoPage('/submission-status')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><DocumentChecked /></el-icon>
          </div>
          <div class="card-body">
            <h3>稿件状态</h3>
            <p>实时查看稿件处理进度与当前阶段</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-show" @click="GoPage('/show')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Reading /></el-icon>
          </div>
          <div class="card-body">
            <h3>文案展示</h3>
            <p>浏览已发布稿件的完整文案内容</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-vsinger" @click="GoPage('/vsinger-show')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Microphone /></el-icon>
          </div>
          <div class="card-body">
            <h3>歌姬查看</h3>
            <p>查看全部歌姬信息及其参与歌曲统计</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-user-status" @click="GoPage('/user-status')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><UserFilled /></el-icon>
          </div>
          <div class="card-body">
            <h3>用户状态</h3>
            <p>查看平台用户在线状态与活跃情况</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-update" @click="GoPage('/update')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Notebook /></el-icon>
          </div>
          <div class="card-body">
            <h3>更新日志</h3>
            <p>查看平台版本更新记录与新功能说明</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-daily-quote" @click="GoPage('/daily-quote')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><ChatLineSquare /></el-icon>
          </div>
          <div class="card-body">
            <h3>每日一言</h3>
            <p>提交与浏览每日经典语句，为平台增添温度</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-register" @click="GoPage('/register')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Plus /></el-icon>
          </div>
          <div class="card-body">
            <h3>用户注册</h3>
            <p>注册新用户账号，加入平台参与更多功能</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- ==================== 文案组模块 ==================== -->
    <section
      class="section-block"
      v-if="isCopyGroup || isAdmin"
    >
      <div class="section-header">
        <el-icon :size="22" color="#E6A23C"><Edit /></el-icon>
        <h2 class="section-title">文案组</h2>
        <span class="section-badge badge-copy">文案组专属</span>
      </div>
      <div class="card-grid">
        <div class="feature-card card-issue" @click="GoPage('/issues')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Management /></el-icon>
          </div>
          <div class="card-body">
            <h3>稿件管理</h3>
            <p>创建、编辑、管理播客稿件，支持歌单导入与内部推荐</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-review" @click="GoPage('/review')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><EditPen /></el-icon>
          </div>
          <div class="card-body">
            <h3>文案编辑</h3>
            <p>查看待编辑稿件并填写、审校文案内容</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- ==================== 管理模块 ==================== -->
    <section
      class="section-block"
      v-if="isGroupAdmin || isSuperAdmin"
    >
      <div class="section-header">
        <el-icon :size="22" color="#F56C6C"><Setting /></el-icon>
        <h2 class="section-title">管理界面</h2>
        <span class="section-badge badge-admin">管理员专属</span>
      </div>
      <div class="card-grid">
        <div
          class="feature-card card-admin-users"
          v-if="isGroupAdmin"
          @click="GoPage('/admin-console')"
        >
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Avatar /></el-icon>
          </div>
          <div class="card-body">
            <h3>用户管理</h3>
            <p>管理平台用户信息、权限分配与状态监控</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div
          class="feature-card card-admin-group"
          v-if="isSuperAdmin"
          @click="GoPage('/group-console')"
        >
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Share /></el-icon>
          </div>
          <div class="card-body">
            <h3>组管理</h3>
            <p>创建、编辑用户组，配置权限与成员</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div
          class="feature-card card-admin-vsinger"
          v-if="isSuperAdmin"
          @click="GoPage('/vsinger-console')"
        >
          <div class="card-icon-wrapper">
            <el-icon :size="32"><Headset /></el-icon>
          </div>
          <div class="card-body">
            <h3>歌姬管理</h3>
            <p>管理歌姬信息，关联歌曲与稿件数据</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- ==================== 个人中心 ==================== -->
    <section class="section-block">
      <div class="section-header">
        <el-icon :size="22" color="#909399"><HomeFilled /></el-icon>
        <h2 class="section-title">个人中心</h2>
      </div>
      <div class="card-grid">
        <div class="feature-card card-profile" @click="GoPage('/profile')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="card-body">
            <h3>个人主页</h3>
            <p>查看与编辑个人资料、账户信息</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="feature-card card-home" @click="GoPage('/')">
          <div class="card-icon-wrapper">
            <el-icon :size="32"><House /></el-icon>
          </div>
          <div class="card-body">
            <h3>返回首页</h3>
            <p>回到 FMInfinity 平台首页</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- 底部提示 -->
    <div class="footer-tip">
      <el-icon><InfoFilled /></el-icon>
      <span>提示：点击任意卡片即可快速跳转到对应功能页面</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import {
  Histogram, Calendar, Platform, TrendCharts, DocumentChecked, Reading,
  Microphone, UserFilled, Notebook, Edit, Management, EditPen,
  Setting, Avatar, Share, Headset, HomeFilled, User, House, InfoFilled,
  ChatLineSquare, Plus
} from "@element-plus/icons-vue";
import api from "@/store/auth";

const router = useRouter();
const authStore = useAuthStore();

// 每日一言
const dailyQuote = ref({
  content: "我的登场即是天意 不必向谁证明唯一",
  link: "",
});

const fetchRandomQuote = async () => {
  try {
    const res = await api.get("/daily-quote/random");
    if (res.data && res.data.content) {
      dailyQuote.value = res.data;
    }
  } catch (err) {
    // 静默失败，使用默认值
    console.error("获取每日一言失败:", err);
  }
};

const openQuoteLink = () => {
  if (dailyQuote.value.link) {
    window.open(`https://www.bilibili.com/opus/${dailyQuote.value.link}`, "_blank");
  }
};

// 角色判断
const isAdmin = computed(() => authStore.user?.group === 'admin');
const isCopyGroup = computed(() => authStore.user?.group === '文案组');
const isGroupAdmin = computed(() => authStore.user?.isGroupAdmin == 1);
const isSuperAdmin = computed(() => authStore.user?.isSuperAdmin);

// 问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  if (hour >= 18 && hour < 24) return "晚上好";
  return "凌晨好";
});

// 当前日期
const currentDate = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const w = weekDays[now.getDay()];
  return `${y}/${m}/${d} 周${w}`;
});

const GoPage = (path) => {
  router.push(path);
};

onMounted(() => {
  fetchRandomQuote();
});
</script>

<style scoped>
/* ========== 容器 ========== */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 12px 40px;
}

@media (min-width: 768px) {
  .dashboard-container {
    padding: 24px 20px 60px;
  }
}

/* ========== 欢迎横幅 ========== */
.welcome-banner {
  background: var(--hero-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  border-radius: 16px;
  padding: 20px 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@media (min-width: 768px) {
  .welcome-banner {
    padding: 32px 36px;
    margin-bottom: 32px;
  }
}
.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.banner-title {
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.wave-emoji {
  display: inline-block;
  animation: wave 2s ease-in-out infinite;
}
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}
.banner-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  margin: 0;
  max-width: 480px;
  line-height: 1.6;
}
.banner-quote {
  margin: 12px 0 0 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-style: italic;
  line-height: 1.6;
  max-width: 520px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  cursor: default;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.5);
}
.banner-quote .quote-icon {
  flex-shrink: 0;
}
.banner-quote .quote-text {
  flex: 1;
}
.banner-quote .quote-link-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
  font-style: normal;
}
.banner-quote .quote-link-hint:hover {
  color: #fff;
}
.banner-stats {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 14px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 2px;
}

/* ========== 区块 ========== */
.section-block {
  margin-bottom: 28px;
  animation: fadeInUp 0.5s ease forwards;
}
.section-block:nth-child(2) { animation-delay: 0.05s; }
.section-block:nth-child(3) { animation-delay: 0.1s; }
.section-block:nth-child(4) { animation-delay: 0.15s; }
.section-block:nth-child(5) { animation-delay: 0.2s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--card-border, #ebeef5);
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #303133);
  margin: 0;
}
.section-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  background: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}
.section-badge.badge-copy {
  background: #fdf6ec;
  color: #E6A23C;
}
.section-badge.badge-admin {
  background: #fef0f0;
  color: #F56C6C;
}

/* ========== 卡片网格 ========== */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* ========== 功能卡片 ========== */
.feature-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 20px 16px;
  border-radius: 12px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e4e7ed);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 0 4px 4px 0;
  transition: all 0.25s;
  opacity: 0;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}
.feature-card:hover::before {
  opacity: 1;
}
.feature-card:active {
  transform: translateY(-1px);
}

/* 左侧图标 */
.card-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  transition: transform 0.25s;
}
.feature-card:hover .card-icon-wrapper {
  transform: scale(1.1);
}

/* 中间文字 */
.card-body {
  flex: 1;
  min-width: 0;
}
.card-body h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}
.card-body p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary, #909399);
  line-height: 1.5;
}

/* 右侧箭头 */
.card-arrow {
  font-size: 20px;
  color: #c0c4cc;
  transition: all 0.25s;
  flex-shrink: 0;
}
.feature-card:hover .card-arrow {
  color: #409EFF;
  transform: translateX(4px);
}

/* ========== 各卡片配色 ========== */
.card-vote .card-icon-wrapper { background: linear-gradient(135deg, #409EFF, #337ecc); }
.card-vote:hover::before { background: #409EFF; }

.card-status .card-icon-wrapper { background: linear-gradient(135deg, #67C23A, #529b2e); }
.card-status:hover::before { background: #67C23A; }

.card-show .card-icon-wrapper { background: linear-gradient(135deg, #E6A23C, #c98c2e); }
.card-show:hover::before { background: #E6A23C; }

.card-vsinger .card-icon-wrapper { background: linear-gradient(135deg, #f56c6c, #d9534f); }
.card-vsinger:hover::before { background: #F56C6C; }

.card-user-status .card-icon-wrapper { background: linear-gradient(135deg, #909399, #7a7d84); }
.card-user-status:hover::before { background: #909399; }

.card-update .card-icon-wrapper { background: linear-gradient(135deg, #9b59b6, #7d3c98); }
.card-update:hover::before { background: #9b59b6; }

.card-daily-quote .card-icon-wrapper { background: linear-gradient(135deg, #00bcd4, #0097a7); }
.card-daily-quote:hover::before { background: #00bcd4; }

.card-issue .card-icon-wrapper { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.card-issue:hover::before { background: #e74c3c; }

.card-review .card-icon-wrapper { background: linear-gradient(135deg, #1abc9c, #16a085); }
.card-review:hover::before { background: #1abc9c; }

.card-admin-users .card-icon-wrapper { background: linear-gradient(135deg, #2c3e50, #34495e); }
.card-admin-users:hover::before { background: #2c3e50; }

.card-admin-group .card-icon-wrapper { background: linear-gradient(135deg, #8e44ad, #7d3c98); }
.card-admin-group:hover::before { background: #8e44ad; }

.card-admin-vsinger .card-icon-wrapper { background: linear-gradient(135deg, #d35400, #e67e22); }
.card-admin-vsinger:hover::before { background: #d35400; }

.card-profile .card-icon-wrapper { background: linear-gradient(135deg, #3498db, #2980b9); }
.card-profile:hover::before { background: #3498db; }

.card-home .card-icon-wrapper { background: linear-gradient(135deg, #95a5a6, #7f8c8d); }
.card-home:hover::before { background: #95a5a6; }

.card-register .card-icon-wrapper { background: linear-gradient(135deg, #67C23A, #529b2e); }
.card-register:hover::before { background: #67C23A; }

/* ========== 底部提示 ========== */
.footer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-secondary, #909399);
  font-size: 13px;
  margin-top: 8px;
}

/* ========== 响应式 ========== */
@media (max-width: 767px) {
  .dashboard-container {
    padding: 12px 8px 32px;
  }
  .welcome-banner {
    padding: 16px 14px;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .banner-title {
    font-size: 20px;
  }
  .banner-subtitle {
    font-size: 13px;
  }
  .banner-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .banner-stats {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
  .stat-item {
    padding: 10px 14px;
  }
  .card-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .feature-card {
    padding: 14px 14px 14px 12px;
  }
  .section-title {
    font-size: 17px;
  }
  .card-body h3 {
    font-size: 15px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
