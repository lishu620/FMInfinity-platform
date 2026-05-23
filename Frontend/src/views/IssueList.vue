<template>
  <div class="page-container">
    <div class="issue-list-box">
      <div class="header-row">
        <h1 class="page-title">稿件管理</h1>

        <div v-if="authStore.isSuperAdmin">
          <el-button type="success" size="default" @click="createIssue">
            <i class="el-icon-plus"></i> 创建稿件
          </el-button>
        </div>
      </div>

      <!-- 电台列表卡片 -->
      <div class="issue-card-list">
        <el-card
          v-for="issue in issues"
          :key="issue.id"
          class="issue-card"
          shadow="hover"
        >
          <div class="card-header">
            <h2 class="card-title">{{ issue.title }}</h2>

            <!-- 按钮组：进入详情 + 删除稿件 并排整齐 -->
            <div class="button-group">
              <el-button
                type="primary"
                size="default"
                @click="router.push(`/issues/${issue.id}`)"
              >
                进入详情
              </el-button>
              <el-button
                v-if="authStore.isSuperAdmin"
                type="danger"
                size="default"
                @click="deleteIssue(issue.id, issue.title)"
              >
                删除稿件
              </el-button>
            </div>
          </div>
          <div class="card-status">
            状态：
            <el-tag :type="getStatusTagType(issue.status)" size="default">
              {{ getStatusText(issue.status) }}
            </el-tag>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 创建稿件弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="请输入本期稿件标题"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="0">
        <el-form-item>
          <el-input
            v-model="newIssueTitle"
            placeholder="请输入本期稿件标题"
            clearable
            @keyup.enter="confirmCreate"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";

const router = useRouter();
const authStore = useAuthStore();
const issues = ref([]);

// 弹窗相关状态
const createDialogVisible = ref(false);
const newIssueTitle = ref("音乐推荐");

// 状态文字及颜色
const getStatusText = (status) => {
  const statusMap = {
    draft: "预处理",
    submitting: "文案选歌",
    voting: "投票",
    confirmed: "文案编写",
    published: "稿件发布",
  };
  return statusMap[status] || status;
};

const getStatusTagType = (status) => {
  const map = {
    draft: "info",
    submitting: "primary",
    voting: "warning",
    confirmed: "success",
    published: "success",
  };
  return map[status] || "";
};

// 获取列表
const fetchIssues = async () => {
  try {
    const { data } = await api.get("/issue");
    issues.value = data;
  } catch (err) {
    console.error("获取稿件失败", err);
  }
};

// 打开创建弹窗
const createIssue = () => {
  newIssueTitle.value = "";
  createDialogVisible.value = true;
};

// 确认创建
const confirmCreate = async () => {
  const title = newIssueTitle.value.trim();
  if (!title) {
    ElMessage.warning("请输入稿件标题！");
    return;
  }

  try {
    await api.post("/issue", { title, adminIds: [] });
    fetchIssues();
    ElMessage.success("创建成功");
    createDialogVisible.value = false;
  } catch (err) {
    ElMessage.error("创建失败：" + (err.response?.data?.message || "未知错误"));
  }
};

// 删除稿件
const deleteIssue = async (issueId, title) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${title}」吗？此操作会同时删除所有关联数据，且不可恢复！`,
      "危险操作",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "error",
      },
    );

    await api.delete(`/issue/${issueId}`);
    ElMessage.success("稿件已删除");
    fetchIssues();
  } catch (err) {
    console.error("删除稿件失败:", err);
    ElMessage.error("删除失败：" + (err.response?.data?.message || "未知错误"));
  }
};

onMounted(() => {
  fetchIssues();
});
</script>

<style scoped>
.issue-card {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* 按钮并排、间距统一 */
.button-group {
  display: flex;
  gap: 8px;
}

.card-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.card-status {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-btn-box {
  margin-top: 30px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
</style>
