<template>
  <div class="daily-quote-container">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon :size="28" color="#409EFF"><ChatLineSquare /></el-icon>
        每日一言
      </h1>
      <p class="page-desc">提交你心中的经典语句，让它成为平台的每日一言</p>
    </div>

    <!-- 提交表单 -->
    <div class="submit-card">
      <h3 class="card-title">
        <el-icon :size="20"><EditPen /></el-icon>
        提交新的一言
      </h3>
      <el-form :model="form" label-width="80px" @submit.prevent="handleSubmit">
        <el-form-item label="一言内容" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
            placeholder="请输入每日一言内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="B站链接">
          <el-input
            v-model="form.link"
            placeholder="请输入B站完整链接（例如：https://www.bilibili.com/opus/1211195857160896516）"
          />
          <span class="form-tip">填写完整B站opus链接或纯数字ID均可，系统会自动提取</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 每日一言列表（管理员可见） -->
    <div class="quote-list-card" v-if="isAdmin">
      <h3 class="card-title">
        <el-icon :size="20"><List /></el-icon>
        管理每日一言（共 {{ quotes.length }} 条）
      </h3>

      <el-table :data="quotes" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
        <el-table-column label="链接" width="120">
          <template #default="{ row }">
            <el-link
              v-if="row.link"
              :href="'https://www.bilibili.com/opus/' + row.link"
              target="_blank"
              type="primary"
              :underline="false"
            >
              打开链接
            </el-link>
            <span v-else class="no-link">无</span>
          </template>
        </el-table-column>
        <el-table-column label="提交者" width="120">
          <template #default="{ row }">
            {{ row.submitter?.nickname || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isUsed ? 'success' : 'info'" size="small">
              {{ row.isUsed ? '已使用' : '未使用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isUsed"
              type="success"
              size="small"
              @click="markUsed(row)"
              :loading="row._marking"
            >
              标记已用
            </el-button>
            <el-button type="danger" size="small" @click="deleteQuote(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 普通用户查看自己提交的 -->
    <div class="quote-list-card" v-if="!isAdmin && myQuotes.length > 0">
      <h3 class="card-title">
        <el-icon :size="20"><List /></el-icon>
        我的提交（共 {{ myQuotes.length }} 条）
      </h3>

      <el-table :data="myQuotes" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="链接" width="120">
          <template #default="{ row }">
            <el-link
              v-if="row.link"
              :href="'https://www.bilibili.com/opus/' + row.link"
              target="_blank"
              type="primary"
              :underline="false"
            >
              打开链接
            </el-link>
            <span v-else class="no-link">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isUsed ? 'success' : 'info'" size="small">
              {{ row.isUsed ? '已使用' : '未使用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";
import { ChatLineSquare, EditPen, List } from "@element-plus/icons-vue";
import api from "@/store/auth";

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.group === "admin");

const form = reactive({
  content: "",
  link: "",
});

const submitting = ref(false);
const loading = ref(false);
const quotes = ref([]);

const myQuotes = computed(() => {
  if (isAdmin.value) return [];
  return quotes.value.filter((q) => q.userId === authStore.user?.id);
});

const resetForm = () => {
  form.content = "";
  form.link = "";
};

// 从完整URL中提取B站opus ID
const extractLinkId = (url) => {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  // 如果已经是纯数字ID，直接返回
  if (/^\d+$/.test(trimmed)) return trimmed;
  // 从URL中提取 opus/ 后面的数字ID
  const match = trimmed.match(/opus\/(\d+)/);
  return match ? match[1] : trimmed;
};

const handleSubmit = async () => {
  if (!form.content.trim()) {
    ElMessage.warning("请输入一言内容");
    return;
  }

  submitting.value = true;
  try {
    const res = await api.post("/daily-quote", {
      content: form.content.trim(),
      link: extractLinkId(form.link),
    });
    ElMessage.success("提交成功！");
    resetForm();
    await fetchQuotes();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "提交失败");
  } finally {
    submitting.value = false;
  }
};

const fetchQuotes = async () => {
  loading.value = true;
  try {
    const res = await api.get("/daily-quote");
    quotes.value = res.data;
  } catch (err) {
    console.error("获取列表失败:", err);
  } finally {
    loading.value = false;
  }
};

const markUsed = async (row) => {
  try {
    row._marking = true;
    await api.put(`/daily-quote/${row.id}/use`);
    ElMessage.success("已标记为使用");
    await fetchQuotes();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "操作失败");
  } finally {
    row._marking = false;
  }
};

const deleteQuote = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除这条每日一言吗？", "确认删除", {
      type: "warning",
    });
    await api.delete(`/daily-quote/${row.id}`);
    ElMessage.success("删除成功");
    await fetchQuotes();
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err.response?.data?.message || "删除失败");
    }
  }
};

onMounted(() => {
  fetchQuotes();
});
</script>

<style scoped>
.daily-quote-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-primary, #303133);
}

.page-desc {
  color: var(--text-secondary, #909399);
  font-size: 15px;
  margin: 0;
}

.submit-card,
.quote-list-card {
  background: var(--card-bg, rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 24px;
  border: 1px solid var(--card-border, rgba(255, 255, 255, 0.3));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: var(--text-primary, #303133);
}

.form-tip {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin-top: 4px;
  display: block;
}

.no-link {
  color: var(--text-secondary, #c0c4cc);
}
</style>
