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
        <el-menu-item index="9" @click.native="openNoticeDrawer">
          <el-badge :value="noticeCount" :max="99" class="notice-badge">
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
    v-model="noticeDrawerVisible"
    title="系统通知"
    direction="rtl"
    size="400px"
    @open="loadNoticeList"
  >
    <div class="notice-container">
      <div v-if="noticeList.length === 0" class="empty-notice">
        暂无通知消息
      </div>
      <div
        v-else
        class="notice-item"
        v-for="item in noticeList"
        :key="item.id"
        @click="readNotice(item)"
      >
        <div class="notice-title">{{ item.title }}</div>
        <div class="notice-content">{{ item.content }}</div>
        <div class="notice-time">{{ item.createdAt }}</div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { ElMessage } from "element-plus";
import axios from "axios"; // ✅ 修复：引入 axios

const router = useRouter();
const authStore = useAuthStore();
const activeIndex = ref("1");

// 通知相关
const noticeDrawerVisible = ref(false);
const noticeCount = ref(0);
const noticeList = ref([]);

// 问候语
const greeting = computed(() => {
  if (!authStore.isLoggedIn) return "";
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "早上好";
  if (hour >= 12 && hour < 18) return "下午好";
  if (hour >= 18 && hour < 24) return "晚上好";
  return "凌晨好";
});

// 打开通知抽屉
const openNoticeDrawer = () => {
  noticeDrawerVisible.value = true;
};

// 加载通知（终极版，带 token）
const loadNoticeList = async () => {
  if (!authStore.isLoggedIn) return;
  try {
    const res = await axios.get("/api/notice/list", {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    noticeList.value = res.data.list;
    noticeCount.value = res.data.unReadCount;
  } catch (err) {
    console.error("加载通知失败", err);
  }
};

// 标记已读（终极版，带 token）
const readNotice = async (item) => {
  try {
    await axios.post(
      `/api/notice/read/${item.id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      },
    );
    item.isRead = true;
    noticeCount.value = Math.max(0, noticeCount.value - 1);
    ElMessage.success("已读通知");
  } catch (err) {
    console.error("标记已读失败", err);
  }
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

// 注销
const logout = () => {
  authStore.logout();
  router.push("/login");
  noticeCount.value = 0;
  noticeList.value = [];
};

// 路由高亮 + ✅ 修复：页面加载时自动获取通知（角标显示）
onMounted(() => {
  const path = router.currentRoute.value.path;
  if (path === "/") activeIndex.value = "1";
  if (path === "/issues") activeIndex.value = "2";
  if (path === "/vote") activeIndex.value = "4";
  if (path === "/admin-console") activeIndex.value = "3-1";
  if (path === "/profile") activeIndex.value = "11";

  // ✅ 页面加载就获取通知
  if (authStore.isLoggedIn) {
    loadNoticeList();
  }
});
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
  cursor: pointer;
  transition: background 0.3s;
}

.notice-item:hover {
  background-color: #f5f7fa;
}

.notice-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.notice-content {
  color: #666;
  font-size: 13px;
  margin-bottom: 5px;
}

.notice-time {
  color: #999;
  font-size: 12px;
}

.empty-notice {
  text-align: center;
  padding: 40px 0;
  color: #999;
}
</style>
