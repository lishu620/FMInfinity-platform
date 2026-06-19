<template>
  <div class="issue-detail-container">
    <div class="issue-detail-box">
      <div class="detail-header">
        <div class="header-left">
          <el-button type="default" icon="el-icon-arrow-left" @click="goBack">
            <
          </el-button>

          <h1 class="page-title-detailed">{{ issue.title }}</h1>

          <div class="select-count-wrapper">
            <span class="select-count-label">本期选择</span>
            <span class="select-count-bracket">[</span>
            <button
              class="count-btn count-btn-minus"
              :disabled="!isAdminOrIssueAdmin || issue.selectedCount <= 1"
              @click="decreaseCount"
            >&minus;</button>
            <input
              v-model.number="issue.selectedCount"
              type="number"
              class="count-input"
              :disabled="!isAdminOrIssueAdmin"
              :min="1"
              :max="100"
              @change="updateSelectedCount"
            />
            <button
              class="count-btn count-btn-plus"
              :disabled="!isAdminOrIssueAdmin"
              @click="increaseCount"
            >+</button>
            <span class="select-count-bracket">]</span>
            <span class="select-count-label">首歌</span>
          </div>

          <el-button
            v-if="isAdminOrIssueAdmin"
            type="success"
            @click="updateSelectedCountAndFinalize"
          >
            保存数量并更新文案歌曲
          </el-button>

          <el-select
            v-model="issue.status"
            @change="updateStatus"
            class="status-select"
            size="default"
            :disabled="!isAdminOrIssueAdmin"
          >
            <el-option label="预处理" value="draft" />
            <el-option label="歌曲信息补充" value="submitting" />
            <el-option label="投票" value="voting" />
            <el-option label="文案编写" value="confirmed" />
            <el-option label="稿件发布" value="published" />
          </el-select>
        </div>

        <div class="header-buttons" v-if="isAdminOrIssueAdmin">
          <el-button type="primary" @click="openAssignAdmin">
            指定本期管理员
          </el-button>

          <el-button type="success" @click="openImportSongs">
            导入基础歌单
          </el-button>
        </div>
      </div>

      <el-divider />

      <!-- 歌曲列表组件 -->
      <MusicList
        :songs="songs"
        :is-admin-or-issue-admin="isAdminOrIssueAdmin"
        @edit-song="openEditSong"
        @delete-song="deleteSong"
      />

      <el-button
        v-if="isAdminOrIssueAdmin"
        type="primary"
        class="mt-4"
        @click="openAddSong"
      >
        添加歌曲
      </el-button>

      <!-- 本期管理员列表 -->
      <div v-if="isAdminOrIssueAdmin" class="mt-8">
        <div class="admin-header">
          <h2 class="section-title">本期管理员</h2>
          <el-button type="primary" @click="openAssignAdmin">
            指定本期管理员
          </el-button>
        </div>
        <el-table
          :data="admins"
          border
          style="width: 100%; margin-bottom: 20px"
        >
          <el-table-column prop="username" label="账号" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="removeAdmin(scope.row.id)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 文案组音乐模块 -->
      <MusicSelect :issue-id="issueId" :songs="songs" @refresh="fetchSongs" />
    </div>
  </div>

  <!-- 指定管理员弹窗 -->
  <el-dialog v-model="adminDialogVisible" title="指定本期管理员" width="500px">
    <el-select
      v-model="selectedAdminId"
      placeholder="选择用户"
      style="width: 100%"
      class="mb-4"
    >
      <el-option
        v-for="u in allUsers"
        :key="u.id"
        :label="`${u.nickname} (${u.username})`"
        :value="u.id"
      />
    </el-select>
    <template #footer>
      <el-button @click="adminDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="assignAdmin">确认添加</el-button>
    </template>
  </el-dialog>

  <!-- 导入歌单弹窗 -->
  <el-dialog v-model="importDialogVisible" title="导入基础歌单" width="700px">
    <el-input
      v-model="importText"
      type="textarea"
      :rows="10"
      placeholder="粘贴接龙格式自动解析：
1.Bravocat 歌曲名
2.乐正铭 世末歌者"
    />
    <template #footer>
      <el-button @click="importDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="importSongs">解析并导入</el-button>
    </template>
  </el-dialog>

  <!-- 添加歌曲弹窗 -->
  <el-dialog v-model="addDialogVisible" title="添加歌曲" width="500px">
    <el-form label-width="80px" :model="addForm">
      <el-form-item label="歌曲名">
        <el-input v-model="addForm.name" placeholder="必填" />
      </el-form-item>
      <el-form-item label="提交者">
        <el-input v-model="addForm.submitter" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="addSong">确认添加</el-button>
    </template>
  </el-dialog>

  <!-- 编辑歌曲弹窗 -->
  <el-dialog v-model="editDialogVisible" title="编辑歌曲" width="500px">
    <el-form label-width="80px" :model="editForm">
      <el-form-item label="歌曲名">
        <el-input v-model="editForm.name" placeholder="必填" />
      </el-form-item>
      <el-form-item label="提交者">
        <el-input v-model="editForm.submitter" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="editSong">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";

import MusicList from "@/components/MusicList.vue";
import MusicSelect from "../components/MusicSelect.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const issueId = route.params.id;

const issue = ref({});
const songs = ref([]);
const admins = ref([]);
const allUsers = ref([]);

// 弹窗
const adminDialogVisible = ref(false);
const importDialogVisible = ref(false);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const selectedAdminId = ref(null);
const importText = ref("");
const addForm = ref({ name: "", submitter: "" });
const editForm = ref({});

// 返回上一级
const goBack = () => {
  router.go(-1);
};

// 权限：超管 或 本期管理员
const isAdminOrIssueAdmin = computed(() => {
  if (authStore.isSuperAdmin) return true;
  return admins.value.some((a) => a.id === authStore.user.id);
});

// 状态
const statusText = computed(() => {
  const map = {
    draft: "草稿",
    submitting: "补充信息",
    voting: "投票中",
    confirmed: "已确认",
    published: "已发布",
  };
  return map[issue.value.status] || issue.value.status;
});

const tagType = computed(() => {
  const map = {
    draft: "info",
    submitting: "primary",
    voting: "warning",
    confirmed: "success",
    published: "success",
  };
  return map[issue.value.status] || "info";
});

const updateSelectedCountAndFinalize = async () => {
  try {
    if (!issue.value.selectedCount) {
      return ElMessage.warning("请先选择本期选择数量");
    }

    await api.put(`/issue/${issueId}/selected-count`, {
      count: issue.value.selectedCount,
    });

    await api.post(`/issue/${issueId}/finalize-songs`);

    await Promise.all([fetchDetail(), fetchSongs()]);

    ElMessage.success(
      `已更新本期选择 ${issue.value.selectedCount} 首，并同步到文案编写`,
    );
  } catch (err) {
    console.error(err);
    ElMessage.error(err?.response?.data?.message || "更新失败");
  }
};

// 加载数据
const fetchDetail = async () => {
  const { data } = await api.get(`/issue/${issueId}`);
  issue.value = data;
};

const fetchSongs = async () => {
  const { data } = await api.get(`/issue/${issueId}/songs`);
  songs.value = data;
};

const fetchAdmins = async () => {
  const { data } = await api.get(`/issue/${issueId}/admins`);
  admins.value = data;
};

const fetchAllUsers = async () => {
  const { data } = await api.get("/auth/group/users");
  allUsers.value = data;
};

// 更新稿件状态
const updateStatus = async () => {
  try {
    await api.put(`/issue/${issueId}/status`, {
      status: issue.value.status,
    });
    ElMessage.success("状态更新成功");
  } catch (err) {
    ElMessage.error("状态更新失败");
    fetchDetail();
  }
};

// 编辑歌曲
const openEditSong = (row) => {
  editForm.value = { ...row };
  editDialogVisible.value = true;
};

const editSong = async () => {
  if (!editForm.value.name) return ElMessage.warning("歌曲名必填");
  await api.put(`/issue/${issueId}/song/${editForm.value.id}`, {
    name: editForm.value.name,
    submitter: editForm.value.submitter,
  });
  ElMessage.success("修改成功");
  fetchSongs();
  editDialogVisible.value = false;
};

// 1. 指定管理员
const openAssignAdmin = () => {
  adminDialogVisible.value = true;
  fetchAllUsers();
};

const assignAdmin = async () => {
  if (!selectedAdminId.value) return ElMessage.warning("请选择用户");
  await api.post(`/issue/${issueId}/admin`, { userId: selectedAdminId.value });
  ElMessage.success("添加成功");
  fetchAdmins();
  adminDialogVisible.value = false;
};

// 2. 移除管理员
const removeAdmin = async (userId) => {
  await ElMessageBox.confirm("确定移除该管理员？");
  await api.delete(`/issue/${issueId}/admin/${userId}`);
  ElMessage.success("移除成功");
  fetchAdmins();
};

// 3. 导入歌单
const openImportSongs = () => {
  importDialogVisible.value = true;
};

const importSongs = async () => {
  const text = importText.value.trim();
  if (!text) return ElMessage.warning("请输入歌单");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const songList = [];

  for (const line of lines) {
    const reg = /^(\d+)\.\s*(\S.+?)\s+(\S.+)$/;
    const match = line.match(reg);

    if (match) {
      const submitter = match[2].trim();
      const name = match[3].trim();
      songList.push({ name, submitter });
    } else {
      songList.push({ name: line.trim(), submitter: "" });
    }
  }

  try {
    await api.post(`/issue/${issueId}/import-songs`, { songs: songList });
    ElMessage.success(`导入成功：${songList.length} 首`);
    fetchSongs();
    importDialogVisible.value = false;
    importText.value = "";
  } catch (err) {
    console.error(err);
    ElMessage.error("导入失败");
  }
};

// 4. 添加单首歌曲
const openAddSong = () => {
  addDialogVisible.value = true;
  addForm.value = { name: "", submitter: "" };
};

const addSong = async () => {
  if (!addForm.value.name) return ElMessage.warning("歌曲名必填");
  await api.post(`/issue/${issueId}/song`, {
    ...addForm.value,
    isAdminInsert: true,
  });
  ElMessage.success("添加成功");
  fetchSongs();
  addDialogVisible.value = false;
};

// 6. 删除歌曲
const deleteSong = async (songId) => {
  await ElMessageBox.confirm("确定删除该歌曲？");
  await api.delete(`/issue/${issueId}/song/${songId}`);
  fetchSongs();
};

onMounted(async () => {
  await fetchDetail();
  await fetchSongs();
  await fetchAdmins();
});

const decreaseCount = () => {
  if (issue.value.selectedCount > 1) {
    issue.value.selectedCount--;
    updateSelectedCount();
  }
};

const increaseCount = () => {
  const newVal = (issue.value.selectedCount || 0) + 1;
  if (newVal <= 100) {
    issue.value.selectedCount = newVal;
    updateSelectedCount();
  }
};

const updateSelectedCount = async () => {
  try {
    await api.put(`/issue/${issueId}/selected-count`, {
      count: issue.value.selectedCount,
    });

    ElMessage.success("设置成功");
  } catch (err) {
    ElMessage.error("设置失败");
    fetchDetail();
  }
};

const finalizeSongs = async () => {
  try {
    await api.post(`/issue/${issueId}/finalize-songs`);
    ElMessage.success("已按票数自动选歌");
    fetchSongs();
  } catch (err) {
    ElMessage.error("自动选歌失败");
  }
};
</script>

<style scoped>
.issue-detail-container {
  max-width: 1400px;
  margin: 16px auto;
  padding: 0 12px;
}

@media (min-width: 768px) {
  .issue-detail-container {
    margin: 40px auto;
    padding: 0 20px;
  }
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.issue-detail-box {
  background: var(--card-bg, #fff);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  animation: fadeInUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) both;
}

@media (min-width: 768px) {
  .issue-detail-box {
    padding: 40px;
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .header-left {
    width: 100%;
    gap: 8px;
  }
}

.page-title-detailed {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

@media (min-width: 768px) {
  .page-title-detailed {
    font-size: 26px;
  }
}

.status-select {
  width: 140px;
}

.header-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .header-buttons {
    width: 100%;
  }
  .header-buttons .el-button {
    flex: 1;
    min-width: 0;
  }
}

.mt-4 {
  margin-top: 16px;
}
.mt-8 {
  margin-top: 32px;
}

/* 本期选择数量组件 */
.select-count-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .select-count-wrapper {
    width: 100%;
    justify-content: flex-start;
  }
}

.select-count-label {
  font-size: 13px;
  color: #606266;
}

@media (min-width: 768px) {
  .select-count-label {
    font-size: 14px;
  }
}

.select-count-bracket {
  font-size: 16px;
  font-weight: bold;
  color: #909399;
  user-select: none;
}

.count-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  color: #606266;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: all 0.2s;
}

.count-btn:hover:not(:disabled) {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.count-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.count-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.count-input {
  width: 56px;
  height: 28px;
  text-align: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  outline: none;
  padding: 0 4px;
  -moz-appearance: textfield;
}

.count-input::-webkit-inner-spin-button,
.count-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.count-input:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
}

.count-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 响应式表格 */
@media (max-width: 767px) {
  .el-table {
    font-size: 12px;
  }
}
</style>
