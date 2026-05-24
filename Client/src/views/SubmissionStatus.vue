<template>
  <div class="page-container">
    <h1 class="page-title">所有稿件列表</h1>
    <p class="tip">当前所有稿件及当前流程进度</p>

    <div class="issue-list">
      <div class="issue-row" v-for="issue in issues" :key="issue.id">
        <div class="issue-info">
          <div class="info-header">
            <h3>{{ issue.title }}</h3>
            <el-tag :type="statusTagType(issue.status)" size="small">
              {{ statusText(issue.status) }}
            </el-tag>
          </div>
          <div class="info-meta">
            <span>本期选歌数：{{ issue.selectedCount || 0 }}</span>
          </div>
        </div>

        <div class="steps-container">
          <el-steps
            :active="getStepActive(issue.status)"
            align-center
            finish-status="success"
            process-status="primary"
          >
            <el-step title="预处理" />
            <el-step title="文案选歌" />
            <el-step title="投票" />
            <el-step title="文案编写" />
            <el-step title="稿件发布" />
          </el-steps>
        </div>
      </div>

      <div class="empty" v-if="issues.length === 0">暂无任何稿件</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElTag, ElSteps, ElStep, ElButton } from "element-plus";
import api from "@/store/auth";

const issues = ref([]);

// 加载所有稿件
const loadIssues = async () => {
  try {
    const res = await api.get("/issue");
    issues.value = res.data || [];
  } catch (e) {
    console.error(e);
    ElMessage.error("加载稿件列表失败");
  }
};

// 状态 → 步骤索引
const getStepActive = (status) => {
  const map = {
    draft: 0,
    submitting: 1,
    voting: 2,
    confirmed: 3,
    published: 4,
  };
  return map[status] ?? 0;
};

// 状态文本
const statusText = (status) => {
  const map = {
    draft: "预处理",
    submitting: "文案选歌",
    voting: "投票",
    confirmed: "文案编写",
    published: "稿件发布",
  };
  return map[status] || status || "-";
};

// 状态标签颜色
const statusTagType = (status) => {
  const map = {
    draft: "info",
    submitting: "warning",
    voting: "primary",
    confirmed: "success",
    published: "success",
  };
  return map[status] || "info";
};

onMounted(() => {
  loadIssues();
});
</script>

<style scoped>
.issue-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.issue-row {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.issue-info {
  flex: 0 0 220px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.info-header h3 {
  margin: 0;
  font-size: 18px;
}

.info-meta {
  font-size: 14px;
  color: #666;
}

.info-meta span {
  margin-right: 16px;
}

.steps-container {
  flex: 1;
  min-width: 400px;
}

.empty {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
