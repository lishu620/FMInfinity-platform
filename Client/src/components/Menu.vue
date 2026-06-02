<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
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
    </el-sub-menu>

    <div class="right-menu">
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
import { ElMessage } from "element-plus";

const router = useRouter();
const authStore = useAuthStore();
const noticeStore = useNotificationStore();
const activeIndex = ref("1");

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
  transition: opacity 0.2s;
}

.notice-item:hover .notice-delete-btn {
  opacity: 1;
}

.notice-content {
  color: #666;
  font-size: 13px;
  margin-bottom: 5px;
  padding-left: 16px;
  cursor: pointer;
}

.notice-time {
  color: #999;
  font-size: 12px;
  padding-left: 16px;
}

.empty-notice {
  text-align: center;
  padding: 40px 0;
  color: #999;
}
</style>
