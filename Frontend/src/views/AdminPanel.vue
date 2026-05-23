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
const authStore = useAuthStore();
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

onMounted(() => {
  fetchUsers();
  fetchPendingUsers();
  fetchStatus();
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
</style>
