<template>
  <div class="page-container">
    <h1 class="page-title">用户状态</h1>
    <p class="tip">查看平台用户的在线状态（公开信息）</p>

    <div class="status-summary">
      <el-card class="summary-card">
        <div class="summary-content">
          <div class="summary-item online">
            <span class="summary-num">{{ onlineCount }}</span>
            <span class="summary-label">在线</span>
          </div>
          <div class="summary-item offline">
            <span class="summary-num">{{ offlineCount }}</span>
            <span class="summary-label">离线</span>
          </div>
          <div class="summary-item total">
            <span class="summary-num">{{ users.length }}</span>
            <span class="summary-label">总用户</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="section">
      <el-table :data="users" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <span class="status-dot" :class="{ online: row.isOnline, offline: !row.isOnline }"></span>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="group" label="用户组" width="120" />
        <el-table-column label="在线状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isOnline ? 'success' : 'info'" size="small" effect="dark">
              {{ row.isOnline ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" width="180">
          <template #default="{ row }">
            {{ row.lastSeenAt ? formatLastSeen(row.lastSeenAt) : '从未活跃' }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";

const users = ref([]);
const loading = ref(false);

const onlineCount = computed(() => users.value.filter((u) => u.isOnline).length);
const offlineCount = computed(() => users.value.filter((u) => !u.isOnline).length);

function formatLastSeen(dateStr) {
  if (!dateStr) return "从未活跃";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

async function fetchUserStatus() {
  loading.value = true;
  try {
    const { data } = await axios.get("/api/auth/users/public-status");
    users.value = data;
  } catch (err) {
    console.error("获取用户状态失败:", err);
    ElMessage.error("获取用户状态失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchUserStatus();
});
</script>

<style scoped>
.status-summary {
  margin-bottom: 24px;
}

.summary-card {
  max-width: 500px;
}

.summary-content {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-num {
  font-size: 28px;
  font-weight: bold;
}

.summary-label {
  font-size: 14px;
  color: #909399;
}

.summary-item.online .summary-num {
  color: #67c23a;
}

.summary-item.offline .summary-num {
  color: #909399;
}

.summary-item.total .summary-num {
  color: #409eff;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.online {
  background-color: #67c23a;
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
}

.status-dot.offline {
  background-color: #c0c4cc;
}

.section {
  margin-top: 8px;
}
</style>
