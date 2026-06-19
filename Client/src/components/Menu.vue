<template>
  <!-- 桌面端菜单 -->
  <div class="menu-wrapper">
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo desktop-menu"
      mode="horizontal"
      :ellipsis="false"
      @select="handleSelect"
    >
      <el-menu-item index="0">
        <img style="width: 100px" src="../images/logo.svg" alt="logo" />
      </el-menu-item>

      <div class="greeting-text" v-if="authStore.isLoggedIn">
        {{ greeting }}, {{ authStore.user?.nickname }}
      </div>

      <el-menu-item index="1">首页</el-menu-item>
      <el-menu-item
        index="2"
        v-if="['admin', '文案组'].includes(authStore.user?.group)"
      >
        稿件管理
      </el-menu-item>
      <el-menu-item index="4">稿件投票</el-menu-item>
      <el-menu-item index="5">文案编辑</el-menu-item>
      <el-sub-menu index="6">
        <template #title>公共查询</template>
        <el-menu-item index="6-1">文案展示</el-menu-item>
        <el-menu-item index="6-2">稿件状态</el-menu-item>
        <el-menu-item index="6-3">歌姬查看</el-menu-item>
        <el-menu-item index="6-4">用户状态</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="3" v-if="authStore.user?.isGroupAdmin == 1">
        <template #title>管理界面</template>
        <el-menu-item index="3-1">用户管理</el-menu-item>
        <el-menu-item index="3-2" v-if="authStore.user?.isSuperAdmin"
          >组管理</el-menu-item
        >
        <el-menu-item index="3-3">歌姬管理</el-menu-item>
        <el-menu-item index="3-4" v-if="authStore.user?.isSuperAdmin"
          >系统设置</el-menu-item
        >
      </el-sub-menu>

      <div class="right-menu">
        <!-- 主题切换 -->
        <el-menu-item index="theme" class="theme-switch">
          <el-dropdown trigger="click" @command="handleThemeChange">
            <span class="theme-trigger" @click.stop>
              🎨 主题
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="t in themeStore.themes"
                  :key="t.id"
                  :command="t.id"
                  :class="{ 'is-active': themeStore.currentTheme === t.id }"
                >
                  <span
                    class="theme-dot"
                    :style="{ background: t.primary }"
                  ></span>
                  {{ t.name }}
                  <span v-if="themeStore.currentTheme === t.id">✓</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-menu-item>

        <el-menu-item index="10" v-if="!authStore.isLoggedIn" class="login-btn">
          登录
        </el-menu-item>

        <template v-else>
          <!-- 通知按钮 -->
          <el-menu-item index="9" @click.native="noticeStore.isDrawerOpen = true">
            <el-badge :value="noticeStore.unReadCount" :max="99" class="notice-badge">
              通知
            </el-badge>
          </el-menu-item>

          <el-menu-item index="11">个人主页</el-menu-item>
          <el-menu-item index="12" @click="logout">注销</el-menu-item>
        </template>
      </div>
    </el-menu>

    <!-- 移动端汉堡菜单 -->
    <div class="mobile-nav">
      <div class="mobile-nav-header">
        <img style="height: 32px" src="../images/logo.svg" alt="logo" @click="router.push('/')" />
        <div class="mobile-nav-actions">
          <el-badge v-if="authStore.isLoggedIn" :value="noticeStore.unReadCount" :max="99" class="mobile-notice">
            <el-button circle size="small" @click="noticeStore.isDrawerOpen = true">
              🔔
            </el-button>
          </el-badge>
          <el-button circle size="small" @click="mobileMenuOpen = !mobileMenuOpen">
            {{ mobileMenuOpen ? '✕' : '☰' }}
          </el-button>
        </div>
      </div>

      <!-- 移动端下拉菜单 -->
      <transition name="mobile-slide">
        <div class="mobile-menu-panel" v-if="mobileMenuOpen">
          <div class="mobile-greeting" v-if="authStore.isLoggedIn">
            {{ greeting }}, {{ authStore.user?.nickname }}
          </div>

          <div class="mobile-menu-item" @click="navTo('/')">🏠 首页</div>

          <div class="mobile-menu-item" v-if="['admin', '文案组'].includes(authStore.user?.group)"
            @click="navTo('/issues')">📋 稿件管理</div>

          <div class="mobile-menu-item" @click="navTo('/vote')">📊 稿件投票</div>
          <div class="mobile-menu-item" @click="navTo('/review')">✏️ 文案编辑</div>

          <div class="mobile-section-title">公共查询</div>
          <div class="mobile-menu-item" @click="navTo('/show')">📄 文案展示</div>
          <div class="mobile-menu-item" @click="navTo('/submission-status')">📝 稿件状态</div>
          <div class="mobile-menu-item" @click="navTo('/vsinger-show')">🎤 歌姬查看</div>
          <div class="mobile-menu-item" @click="navTo('/user-status')">👤 用户状态</div>

          <template v-if="authStore.user?.isGroupAdmin == 1">
            <div class="mobile-section-title">管理界面</div>
            <div class="mobile-menu-item" @click="navTo('/admin-console')">👥 用户管理</div>
            <div class="mobile-menu-item" v-if="authStore.user?.isSuperAdmin"
              @click="navTo('/group-console')">🏗️ 组管理</div>
            <div class="mobile-menu-item" @click="navTo('/vsinger-console')">🎵 歌姬管理</div>
            <div class="mobile-menu-item" v-if="authStore.user?.isSuperAdmin"
              @click="navTo('/system-console')">⚙️ 系统设置</div>
          </template>

          <div class="mobile-section-title">主题</div>
          <div class="mobile-theme-switcher">
            <span
              v-for="t in themeStore.themes"
              :key="t.id"
              class="mobile-theme-option"
              :class="{ active: themeStore.currentTheme === t.id }"
              @click="handleThemeChange(t.id)"
            >
              <span class="theme-dot" :style="{ background: t.primary }"></span>
              {{ t.name }}
            </span>
          </div>

          <div class="mobile-menu-divider"></div>

          <template v-if="!authStore.isLoggedIn">
            <div class="mobile-menu-item" @click="navTo('/login')">🔑 登录</div>
          </template>
          <template v-else>
            <div class="mobile-menu-item" @click="navTo('/profile')">👤 个人主页</div>
            <div class="mobile-menu-item logout-item" @click="logout">🚪 注销</div>
          </template>
        </div>
      </transition>
    </div>
  </div>

  <!-- 右侧通知抽屉 -->
  <el-drawer
    v-model="noticeStore.isDrawerOpen"
    title="系统通知"
    direction="rtl"
    size="400px"
    @open="noticeStore.loadNoticeList"
  >
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
        <span>系统通知</span>
        <el-button
          v-if="noticeStore.noticeList.length > 0"
          type="primary"
          text
          size="small"
          @click="noticeStore.readAll"
        >
          全部已读
        </el-button>
      </div>
    </template>

    <div class="notice-container">
      <div v-if="noticeStore.noticeList.length === 0" class="empty-notice">
        <el-empty description="暂无通知消息" :image-size="80" />
      </div>
      <div
        v-else
        class="notice-item"
        :class="{ 'is-read': item.isRead }"
        v-for="item in noticeStore.noticeList"
        :key="item.id"
      >
        <div class="notice-item-header">
          <el-badge :is-dot="!item.isRead" class="notice-dot" />
          <div class="notice-title" @click="handleNoticeClick(item)">{{ item.title }}</div>
          <el-button
            type="danger"
            text
            size="small"
            circle
            @click.stop="noticeStore.deleteNotice(item.id)"
            class="notice-delete-btn"
          >
            ✕
          </el-button>
        </div>
        <div class="notice-content" @click="handleNoticeClick(item)">{{ item.content }}</div>
        <div class="notice-time">{{ formatTime(item.createdAt) }}</div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notification";
import { useThemeStore } from "@/store/theme";
import { ElMessage } from "element-plus";

const router = useRouter();
const authStore = useAuthStore();
const noticeStore = useNotificationStore();
const themeStore = useThemeStore();
const activeIndex = ref("1");
const mobileMenuOpen = ref(false);

// 移动端导航（关闭菜单后跳转）
function navTo(path) {
  mobileMenuOpen.value = false;
  router.push(path);
}

// 关闭菜单的回调（用于 transition）
function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

// 问候语
const greeting = computed(() => {
  if (!authStore.isLoggedIn) return "";
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  if (hour >= 18 && hour < 24) return "晚上好";
  return "凌晨好";
});

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

// 点击通知：标记已读 + 跳转
function handleNoticeClick(item) {
  noticeStore.readNotice(item);
  if (item.jumpPath) {
    noticeStore.isDrawerOpen = false;
    router.push(item.jumpPath);
  }
}

// 注销
const logout = () => {
  authStore.logout();
  noticeStore.clear();
  router.push("/login");
};

// 主题切换
const handleThemeChange = (themeId) => {
  themeStore.setTheme(themeId);
};

// 菜单路由
const handleSelect = (key) => {
  switch (key) {
    case "0":
    case "1":
      router.push("/");
      break;
    case "2":
      router.push("/issues");
      break;
    case "4":
      router.push("/vote");
      break;
    case "5":
      router.push("/review");
      break;
    case "6-1":
      router.push("/show");
      break;
    case "6-2":
      router.push("/submission-status");
      break;
    case "6-3":
      router.push("/vsinger-show");
      break;
    case "6-4":
      router.push("/user-status");
      break;
    case "3-1":
      router.push("/admin-console");
      break;
    case "3-2":
      router.push("/group-console");
      break;
    case "3-3":
      router.push("/vsinger-console");
      break;
    case "3-4":
      router.push("/system-console");
      break;
    case "10":
      router.push("/login");
      break;
    case "11":
      router.push("/profile");
      break;
  }
};

// 路由高亮
onMounted(() => {
  const path = router.currentRoute.value.path;
  if (path === "/") activeIndex.value = "1";
  if (path === "/issues") activeIndex.value = "2";
  if (path === "/vote") activeIndex.value = "4";
  if (path === "/admin-console") activeIndex.value = "3-1";
  if (path === "/system-console") activeIndex.value = "3-4";
  if (path === "/profile") activeIndex.value = "11";
});

// 监听登录状态：登录后连接SSE并加载通知，退出后断开
watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      noticeStore.connectSSE();
      noticeStore.loadNoticeList();
    } else {
      noticeStore.clear();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* ===== 外层包裹 ===== */
.menu-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--card-bg, rgba(255,255,255,0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--card-border, rgba(0,0,0,0.06));
}

/* ===== 桌面菜单 ===== */
.desktop-menu {
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .desktop-menu {
    display: none;
  }
}

.el-menu-demo {
  display: flex;
  align-items: center;
}

.greeting-text {
  color: #333;
  font-size: 14px;
  padding: 0 15px;
  line-height: 60px;
  white-space: nowrap;
}

@media (max-width: 1023px) {
  .greeting-text {
    display: none;
  }
}

.right-menu {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.login-btn {
  color: #409eff !important;
  font-weight: 500;
}

.notice-badge {
  --el-badge-content-bg-color: #f56c6c;
}

.notice-container {
  padding: 10px;
}

.notice-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  transition: background 0.3s;
  border-radius: 6px;
  margin-bottom: 4px;
}

.notice-item:hover {
  background-color: #f5f7fa;
}

.notice-item.is-read {
  opacity: 0.65;
}

.notice-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.notice-dot {
  flex-shrink: 0;
}

.notice-title {
  font-weight: bold;
  flex: 1;
  cursor: pointer;
}

.notice-delete-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.notice-item:hover .notice-delete-btn {
  opacity: 1;
}

.notice-content {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  line-height: 1.5;
}

.notice-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  text-align: right;
}

.empty-notice {
  padding: 40px 0;
  text-align: center;
}

.theme-switch {
  cursor: pointer;
}

.theme-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 14px;
}

.theme-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
  border: 2px solid rgba(0,0,0,0.1);
  vertical-align: middle;
}

/* ===== 移动端导航 ===== */
.mobile-nav {
  display: none;
}

@media (max-width: 767px) {
  .mobile-nav {
    display: block;
  }
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  height: 48px;
}

.mobile-nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-notice {
  --el-badge-content-bg-color: #f56c6c;
}

/* 移动端下拉面板 */
.mobile-menu-panel {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  background: var(--card-bg, rgba(255,255,255,0.98));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--card-border, rgba(0,0,0,0.06));
  padding: 8px 0;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  z-index: 99;
}

.mobile-greeting {
  padding: 10px 16px;
  font-size: 14px;
  color: var(--text-secondary, #666);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  margin-bottom: 4px;
}

.mobile-section-title {
  padding: 10px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #999);
}

.mobile-menu-item {
  padding: 12px 16px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mobile-menu-item:active {
  background: var(--primary-color-light, rgba(137,194,255,0.1));
  transform: scale(0.98);
}

.mobile-menu-item.logout-item {
  color: #f56c6c;
}

.mobile-theme-switcher {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.mobile-theme-option {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 16px;
  cursor: pointer;
  border: 1px solid var(--card-border, rgba(0,0,0,0.08));
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mobile-theme-option.active {
  border-color: var(--primary-color, #409eff);
  background: var(--primary-color-light, rgba(137,194,255,0.12));
}

.mobile-menu-divider {
  height: 6px;
  background: rgba(0,0,0,0.03);
  margin: 4px 0;
}

/* 移动端菜单下滑动画 */
.mobile-slide-enter-active {
  animation: slideDown 0.25s cubic-bezier(0.19, 1, 0.22, 1) both;
}

.mobile-slide-leave-active {
  animation: slideDown 0.2s ease reverse both;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 平板适配：简化桌面菜单 ===== */
@media (min-width: 768px) and (max-width: 1023px) {
  .el-menu--horizontal > .el-menu-item {
    padding: 0 10px;
    font-size: 13px;
  }
  .el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
    padding: 0 10px;
    font-size: 13px;
  }
  .right-menu .el-menu-item {
    padding: 0 8px;
  }
}
</style>
