<template>
  <div class="group-management">
    <h1 class="title">组管理</h1>

    <!-- 创建新组 -->
    <div class="section">
      <h2 class="section-title">创建新组</h2>
      <el-card>
        <el-form @submit.prevent="createGroup" label-width="80px">
          <el-form-item label="组名">
            <el-input v-model="newGroup.name" placeholder="如：文案组" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="newGroup.description"
              type="textarea"
              :rows="3"
              placeholder="组描述"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit">创建组</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 组列表 -->
    <div class="section">
      <h2 class="section-title">用户组列表</h2>
      <el-table :data="groupList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="组名" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editGroup(row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              @click="deleteGroup(row.id)"
              :disabled="row.name === 'admin'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 组管理员管理（弹窗） -->
    <el-dialog v-model="adminDialogVisible" title="组管理员设置" width="600px">
      <el-table :data="groupUserList" style="width: 100%">
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="username" label="账号" />
        <el-table-column label="是否管理员" width="120">
          <template #default="{ row }">
            <el-switch
              v-model="row.isGroupAdmin"
              @change="updateAdminStatus(row.id, row.isGroupAdmin)"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 编辑组弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑组" width="500px">
      <el-form label-width="80px">
        <el-form-item label="组名">
          <el-input v-model="editingGroup.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editingGroup.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";

const groupList = ref([]);
const newGroup = ref({ name: "", description: "" });
const editingGroup = ref({ id: null, name: "", description: "" });
const editDialogVisible = ref(false);
const adminDialogVisible = ref(false);
const currentGroupId = ref(null);
const groupUserList = ref([]);

// 获取组列表
const fetchGroups = async () => {
  const { data } = await api.get("/auth/status");
  groupList.value = data;
};

// 创建组
const createGroup = async () => {
  await api.post("/auth/status", newGroup.value);
  ElMessage.success("创建成功");
  newGroup.value = { name: "", description: "" };
  fetchGroups();
};

// 编辑组
const editGroup = (row) => {
  editingGroup.value = { ...row };
  editDialogVisible.value = true;
};

const updateGroup = async () => {
  await api.put(`/auth/status/${editingGroup.value.id}`, editingGroup.value);
  ElMessage.success("更新成功");
  editDialogVisible.value = false;
  fetchGroups();
};

// 删除组
const deleteGroup = async (id) => {
  await ElMessageBox.confirm("确定删除该组吗？组内有用户时无法删除", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  });
  await api.delete(`/auth/status/${id}`);
  ElMessage.success("删除成功");
  fetchGroups();
};

// 打开管理员设置弹窗
const openAdminDialog = async (groupId) => {
  currentGroupId.value = groupId;
  const { data } = await api.get(`/auth/status/${groupId}/admins`);
  // 这里需要获取组内所有用户，完整接口见后端补充
  // 临时方案：直接获取所有用户并筛选
  const { data: allUsers } = await api.get("/auth/group/users");
  groupUserList.value = allUsers.filter((u) => u.statusId === groupId);
  adminDialogVisible.value = true;
};

// 更新管理员状态
const updateAdminStatus = async (userId, isAdmin) => {
  await api.put(`/auth/status/${currentGroupId.value}/admin/${userId}`, {
    isGroupAdmin: isAdmin,
  });
  ElMessage.success("操作成功");
};

onMounted(() => {
  fetchGroups();
});
</script>

<style scoped>
.group-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 24px;
}
.section {
  margin-bottom: 40px;
}
.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}
</style>
