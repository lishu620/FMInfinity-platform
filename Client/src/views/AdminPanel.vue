<template>
  <div class="page-container">
    <h1 class="page-title">用户管理</h1>

    <!-- 待审核用户 -->
    <div class="section">
      <h2 class="section-title">待审核用户</h2>
      <el-card v-for="user in pendingUsers" :key="user.id" class="user-card">
        <div class="flex-row">
          <div>
            <h3 class="user-name">{{ user.nickname }} ({{ user.username }})</h3>
            <p class="user-info">组：{{ user.Status?.name }}</p>
          </div>
          <div class="flex gap-2">
            <el-button type="success" @click="approveUser(user.id)"
              >通过</el-button
            >
            <el-button type="danger" @click="rejectUser(user.id)"
              >拒绝</el-button
            >
          </div>
        </div>
      </el-card>
      <div v-if="pendingUsers.length === 0" class="empty-tip">
        暂无待审核用户
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="section">
      <h2 class="section-title">用户列表</h2>
      <el-card v-for="user in users" :key="user.id" class="user-card">
        <div class="flex-row">
          <div>
            <h3 class="user-name">{{ user.nickname }} ({{ user.username }})</h3>
            <p class="user-info">
              组：{{ user.Status?.name }} |
              {{ user.isGroupAdmin ? "组管理员" : "普通用户" }} |
              <span :class="{ 'text-red-500': user.isBanned }">
                {{ user.isBanned ? "已封禁" : "正常" }}
              </span>
            </p>
          </div>
          <div class="flex gap-2">
            <!-- 组管理员设置/取消 -->
            <el-button
              v-if="authStore.user?.isSuperAdmin"
              :type="user.isGroupAdmin ? 'warning' : 'primary'"
              size="small"
              @click="toggleGroupAdmin(user.id, !user.isGroupAdmin)"
            >
              {{ user.isGroupAdmin ? "取消管理员" : "设为管理员" }}
            </el-button>
            <!-- 封禁/解封 -->
            <el-button
              :type="user.isBanned ? 'success' : 'danger'"
              size="small"
              @click="toggleBan(user.id, !user.isBanned)"
            >
              {{ user.isBanned ? "解封" : "封禁" }}
            </el-button>
            <!-- 重置密码 -->
            <el-button type="danger" size="small" @click="resetPwd(user.id)">
              重置密码
            </el-button>
            <!-- 删除用户（仅超管可见） -->
            <el-button
              v-if="authStore.user?.isSuperAdmin"
              type="danger"
              size="small"
              @click="deleteUser(user.id)"
            >
              删除用户
            </el-button>
          </div>
        </div>
      </el-card>
      <div v-if="users.length === 0" class="empty-tip">暂无用户</div>
    </div>

    <!-- 创建新用户 -->
    <div class="section" v-if="authStore.user?.isSuperAdmin">
      <h2 class="section-title">创建新用户</h2>
      <el-card>
        <el-form @submit.prevent="createUser" label-width="80px">
          <el-form-item label="账号">
            <el-input v-model="newUser.username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="newUser.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="用户组">
            <el-select v-model="newUser.statusId" placeholder="请选择用户组">
              <el-option
                v-for="status in statusList"
                :key="status.id"
                :label="status.name"
                :value="status.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit">创建用户</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 数据库连接状态（仅超管可见） -->
    <div class="section" v-if="authStore.user?.isSuperAdmin">
      <h2 class="section-title">数据库连接状态</h2>
      <el-card>
        <div v-if="dbStatus" class="db-status">
          <div class="db-row">
            <span class="db-label">连接状态：</span>
            <el-tag :type="dbStatus.connected ? 'success' : 'danger'" size="large">
              {{ dbStatus.connected ? '已连接' : '连接失败' }}
            </el-tag>
          </div>
          <div class="db-row">
            <span class="db-label">数据库类型：</span>
            <span class="db-value">{{ dbStatus.dialect }}</span>
          </div>
          <div class="db-row">
            <span class="db-label">数据库名称：</span>
            <span class="db-value">{{ dbStatus.database }}</span>
          </div>
          <div class="db-row">
            <span class="db-label">主机地址：</span>
            <span class="db-value">{{ dbStatus.host }}</span>
          </div>
          <div class="db-row">
            <span class="db-label">端口：</span>
            <span class="db-value">{{ dbStatus.port }}</span>
          </div>
          <div v-if="!dbStatus.connected" class="db-row">
            <span class="db-label">错误信息：</span>
            <span class="db-value text-red-500">{{ dbStatus.error }}</span>
          </div>
          <div class="db-row" style="margin-top: 12px">
            <el-button size="small" @click="fetchDbStatus" :loading="dbLoading">
              刷新状态
            </el-button>
          </div>
        </div>
        <div v-else class="empty-tip">
          加载中...
        </div>
      </el-card>
    </div>

    <!-- 数据库迁移（仅超管可见） -->
    <div class="section" v-if="authStore.user?.isSuperAdmin">
      <h2 class="section-title">数据库迁移</h2>
      <el-card>
        <el-form label-width="110px">
          <el-form-item label="目标数据库类型">
            <el-radio-group v-model="migration.targetDialect">
              <el-radio value="mysql">MySQL</el-radio>
              <el-radio value="sqlite">SQLite</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- MySQL 配置 -->
          <template v-if="migration.targetDialect === 'mysql'">
            <el-form-item label="主机地址">
              <el-input v-model="migration.mysqlHost" placeholder="localhost" />
            </el-form-item>
            <el-form-item label="端口">
              <el-input v-model.number="migration.mysqlPort" placeholder="3306" />
            </el-form-item>
            <el-form-item label="数据库名">
              <el-input v-model="migration.mysqlDatabase" placeholder="fminfinity" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="migration.mysqlUser" placeholder="fminfinity" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="migration.mysqlPassword" type="password" placeholder="数据库密码" />
            </el-form-item>
          </template>

          <!-- SQLite 配置 -->
          <template v-if="migration.targetDialect === 'sqlite'">
            <el-form-item label="存储路径">
              <el-input v-model="migration.sqliteStorage" placeholder="./main.sqlite" />
            </el-form-item>
          </template>

          <el-form-item>
            <el-button
              type="warning"
              @click="runMigration"
              :loading="migration.migrating"
            >
              仅迁移数据
            </el-button>
            <el-button
              type="primary"
              @click="runSwitchAndMigrate"
              :loading="migration.switching"
            >
              切换并迁移
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 迁移结果 -->
        <div v-if="migration.result" class="migration-result" style="margin-top: 16px">
          <el-alert
            :type="migration.result.error ? 'error' : 'success'"
            :title="migration.result.error ? '迁移失败' : migration.result.message"
            :closable="false"
            show-icon
          />
          <div v-if="migration.result.results" style="margin-top: 12px">
            <div
              v-for="(count, table) in migration.result.results"
              :key="table"
              class="db-row"
            >
              <span class="db-label">{{ table }}：</span>
              <span class="db-value">{{ count.count ?? 0 }} 条记录</span>
            </div>
          </div>
          <div v-if="migration.result.needsRestart" style="margin-top: 12px">
            <el-alert type="warning" title="请重启服务使配置生效" :closable="false" show-icon />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/store/auth";

const users = ref([]);
const pendingUsers = ref([]);
const statusList = ref([]);
const dbStatus = ref(null);
const dbLoading = ref(false);
const authStore = useAuthStore();

// 数据库迁移
const migration = ref({
  targetDialect: "mysql",
  mysqlHost: "localhost",
  mysqlPort: 3306,
  mysqlDatabase: "fminfinity",
  mysqlUser: "fminfinity",
  mysqlPassword: "",
  sqliteStorage: "./main.sqlite",
  migrating: false,
  switching: false,
  result: null,
});
const newUser = ref({
  username: "",
  nickname: "",
  statusId: "",
});

// 获取已通过用户（加固版）
const fetchUsers = async () => {
  try {
    const { data } = await api.get("/auth/group/users");
    users.value = data.map((user) => ({
      ...user,
      isBanned: Boolean(user.isBanned),
    }));
  } catch (err) {
    console.error("获取用户列表失败:", err);
    ElMessage.error("获取用户列表失败");
  }
};

// 获取待审核用户
const fetchPendingUsers = async () => {
  try {
    const { data } = await api.get("/auth/pending-users");
    pendingUsers.value = data;
  } catch (err) {
    console.error("获取待审核用户失败:", err);
    ElMessage.error("获取待审核用户失败");
  }
};

// 获取用户组
const fetchStatus = async () => {
  try {
    const { data } = await api.get("/auth/status");
    statusList.value = data;
  } catch (err) {
    console.error("获取用户组失败:", err);
  }
};

// 重置密码
const resetPwd = async (userId) => {
  try {
    await ElMessageBox.confirm("确定重置密码为 admin@123 吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await api.put(`/auth/user/${userId}/reset-pwd`);
    ElMessage.success("密码重置成功");
    await fetchUsers();
  } catch (err) {
    console.error("重置密码失败:", err);
  }
};

// 创建用户（默认密码 admin@123，自动审核通过）
const createUser = async () => {
  try {
    await api.post("/auth/user", newUser.value);
    ElMessage.success("用户创建成功，默认密码 admin@123");
    newUser.value = {
      username: "",
      nickname: "",
      statusId: "",
    };
    await fetchUsers();
  } catch (err) {
    console.error("创建用户失败:", err);
    ElMessage.error("创建用户失败");
  }
};

// 审核通过
const approveUser = async (userId) => {
  try {
    await ElMessageBox.confirm("确定通过该用户？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await api.post(`/auth/approve/${userId}`);
    ElMessage.success("审核通过");
    await fetchPendingUsers();
    await fetchUsers();
  } catch (err) {
    console.error("审核通过失败:", err);
  }
};

// 审核拒绝
const rejectUser = async (userId) => {
  try {
    await ElMessageBox.confirm("确定拒绝该用户？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await api.post(`/auth/reject/${userId}`);
    ElMessage.success("已拒绝");
    await fetchPendingUsers();
  } catch (err) {
    console.error("拒绝用户失败:", err);
  }
};

// 删除用户（仅超管）
const deleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除该用户吗？此操作不可恢复！",
      "危险操作",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "error",
      },
    );
    await api.delete(`/auth/user/${userId}`);
    ElMessage.success("用户已删除");
    await fetchUsers();
  } catch (err) {
    console.error("删除用户失败:", err);
    ElMessage.error("删除用户失败");
  }
};

// 切换组管理员状态
const toggleGroupAdmin = async (userId, isGroupAdmin) => {
  try {
    await api.put(`/auth/user/${userId}/group-admin`, { isGroupAdmin });
    ElMessage.success(isGroupAdmin ? "设为组管理员成功" : "取消组管理员成功");
    await fetchUsers();
  } catch (err) {
    console.error("操作失败:", err);
    ElMessage.error("操作失败");
  }
};

// 切换封禁状态
const toggleBan = async (userId, isBanned) => {
  try {
    await api.put(`/auth/user/${userId}/ban`, { isBanned });
    ElMessage.success(isBanned ? "封禁成功" : "解封成功");
    await fetchUsers();
  } catch (err) {
    console.error("操作失败:", err);
    ElMessage.error("操作失败");
  }
};

// 获取数据库连接状态（仅超管）
const fetchDbStatus = async () => {
  dbLoading.value = true;
  try {
    const { data } = await api.get("/auth/db-status");
    dbStatus.value = data;
  } catch (err) {
    console.error("获取数据库状态失败:", err);
    dbStatus.value = { connected: false, error: "请求失败" };
  } finally {
    dbLoading.value = false;
  }
};

// 构建目标数据库配置
const buildTargetConfig = () => {
  const m = migration.value;
  if (m.targetDialect === "mysql") {
    return {
      dialect: "mysql",
      host: m.mysqlHost || "localhost",
      port: m.mysqlPort || 3306,
      database: m.mysqlDatabase || "fminfinity",
      username: m.mysqlUser || "fminfinity",
      password: m.mysqlPassword || "",
    };
  } else {
    return {
      dialect: "sqlite",
      storage: m.sqliteStorage || "./main.sqlite",
    };
  }
};

// 仅迁移数据
const runMigration = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要迁移数据到目标数据库吗？目标库的现有数据将被清空！",
      "确认迁移",
      { confirmButtonText: "确定迁移", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }

  migration.value.migrating = true;
  migration.value.result = null;
  try {
    const target = buildTargetConfig();
    const { data } = await api.post("/migration/migrate", { target });
    migration.value.result = data;
    ElMessage.success("数据迁移完成");
  } catch (err) {
    migration.value.result = { error: true, message: err.response?.data?.message || "迁移失败" };
    ElMessage.error("迁移失败");
  } finally {
    migration.value.migrating = false;
  }
};

// 切换并迁移
const runSwitchAndMigrate = async () => {
  try {
    await ElMessageBox.confirm(
      "确定切换数据库并迁移数据吗？这将更新 .env 配置，迁移后需要重启服务。目标库的现有数据将被清空！",
      "确认切换并迁移",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }

  migration.value.switching = true;
  migration.value.result = null;
  try {
    const config = buildTargetConfig();
    const { data } = await api.post("/migration/switch", {
      ...config,
      migrate: true,
    });
    migration.value.result = data;
    ElMessage.success("切换并迁移完成，请重启服务");
  } catch (err) {
    migration.value.result = { error: true, message: err.response?.data?.message || "切换失败" };
    ElMessage.error("切换失败");
  } finally {
    migration.value.switching = false;
  }
};

onMounted(() => {
  fetchUsers();
  fetchPendingUsers();
  fetchStatus();
  if (authStore.isSuperAdmin) {
    fetchDbStatus();
  }
});
</script>

<style scoped>
.section {
  margin-bottom: 40px;
}
.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}
.user-card {
  margin-bottom: 12px;
}
.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}
.user-info {
  font-size: 13px;
  color: #666;
}
.empty-tip {
  color: #999;
  padding: 10px 0;
}
.flex {
  display: flex;
  gap: 8px;
}
.text-red-500 {
  color: #f56c6c;
  font-weight: bold;
}
.db-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.db-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.db-label {
  font-weight: 500;
  min-width: 90px;
  color: #606266;
}
.db-value {
  color: #303133;
}
</style>
