<template>
  <div class="daily-quote-container">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon :size="28" color="#409EFF"><ChatLineSquare /></el-icon>
        每日一言
      </h1>
      <p class="page-desc">提交你心中的经典语句，让它成为平台的每日一言</p>
    </div>

    <!-- ========== 提交表单（所有用户） ========== -->
    <div class="submit-card">
      <h3 class="card-title">
        <el-icon :size="20"><EditPen /></el-icon>
        提交新的一言
      </h3>
      <el-form :model="form" @submit.prevent="handleSubmit">
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
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- ========== 管理员：待选用卡片区 ========== -->
    <div class="quote-cards-section" v-if="isAdmin">
      <div class="section-toolbar">
        <h3 class="section-title-text">
          <el-icon :size="20" color="#409EFF"><Collection /></el-icon>
          待选用一言（{{ unusedQuotes.length }}）
        </h3>
        <el-button type="primary" @click="shuffleQuotes" :icon="RefreshRight" :loading="shuffling">
          随机切换
        </el-button>
      </div>

      <div class="quote-card-grid" v-if="unusedQuotes.length > 0">
        <div
          class="quote-card"
          v-for="q in displayQuotes"
          :key="q.id"
          @click="openSelectDialog(q)"
        >
          <div class="quote-card-index">{{ q._displayIndex }}</div>
          <p class="quote-card-content">「{{ q.content }}」</p>
          <div class="quote-card-footer">
            <span class="quote-card-author">— {{ q.submitter?.nickname || '未知' }}</span>
            <span class="quote-card-date">{{ formatDate(q.createdAt) }}</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无待选用的一言，快去提交吧" />

      <!-- 已选用列表 -->
      <div class="used-section" v-if="usedQuotes.length > 0">
        <h3 class="section-title-text" style="margin-top: 32px;">
          <el-icon :size="20" color="#67C23A"><Select /></el-icon>
          已选用一言（{{ usedQuotes.length }}）
        </h3>
        <el-table :data="usedQuotes" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
          <el-table-column label="链接" width="120">
            <template #default="{ row }">
              <el-link
                v-if="row.link"
                :href="'https://www.bilibili.com/opus/' + row.link"
                target="_blank"
                type="primary"
                :underline="false"
              >打开链接</el-link>
              <span v-else class="no-link">无</span>
            </template>
          </el-table-column>
          <el-table-column label="提交者" width="100">
            <template #default="{ row }">{{ row.submitter?.nickname || '未知' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="deleteQuote(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- ========== 选用弹窗 ========== -->
    <el-dialog v-model="selectDialog.visible" title="选用每日一言" width="520px" destroy-on-close>
      <div class="dialog-quote-preview">
        <span class="dialog-quote-mark">"</span>
        {{ selectDialog.quote?.content }}
        <span class="dialog-quote-mark">"</span>
      </div>
      <el-form style="margin-top: 20px;">
        <el-form-item label="B站链接">
          <el-input
            v-model="selectDialog.link"
            placeholder="请填写完整链接，如 https://www.bilibili.com/opus/1211195857160896516"
          />
        </el-form-item>
        <span class="form-tip">填写完整B站opus链接或纯数字ID均可，留空则不关联链接</span>
      </el-form>
      <template #footer>
        <el-button @click="selectDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelect" :loading="selectDialog.loading">确认选用</el-button>
      </template>
    </el-dialog>

    <!-- ========== 普通用户：我的提交 ========== -->
    <div class="quote-list-card" v-if="!isAdmin && myQuotes.length > 0">
      <h3 class="card-title">
        <el-icon :size="20"><List /></el-icon>
        我的提交（{{ myQuotes.length }}）
      </h3>
      <el-table :data="myQuotes" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
        <el-table-column label="链接" width="100">
          <template #default="{ row }">
            <el-link
              v-if="row.link"
              :href="'https://www.bilibili.com/opus/' + row.link"
              target="_blank"
              type="primary"
              :underline="false"
            >打开</el-link>
            <span v-else class="no-link">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isUsed ? 'success' : 'info'" size="small">
              {{ row.isUsed ? '已选用' : '待选用' }}
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
import { ChatLineSquare, EditPen, List, Collection, RefreshRight, Select } from "@element-plus/icons-vue";
import api from "@/store/auth";

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.group === "admin");

const form = reactive({ content: "" });
const submitting = ref(false);
const loading = ref(false);
const shuffling = ref(false);
const quotes = ref([]);
const displayQuotes = ref([]);

// 选用弹窗
const selectDialog = reactive({
  visible: false,
  quote: null,
  link: "",
  loading: false,
});

const unusedQuotes = computed(() => quotes.value.filter((q) => !q.isUsed));
const usedQuotes = computed(() => quotes.value.filter((q) => q.isUsed));
const myQuotes = computed(() => {
  if (isAdmin.value) return [];
  return quotes.value.filter((q) => q.userId === authStore.user?.id);
});

const resetForm = () => {
  form.content = "";
};

const handleSubmit = async () => {
  if (!form.content.trim()) {
    ElMessage.warning("请输入一言内容");
    return;
  }
  submitting.value = true;
  try {
    await api.post("/daily-quote", { content: form.content.trim() });
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
    if (isAdmin.value) {
      shuffleDisplay();
    }
  } catch (err) {
    console.error("获取列表失败:", err);
  } finally {
    loading.value = false;
  }
};

// 打乱未使用的卡片顺序
const shuffleDisplay = () => {
  shuffling.value = true;
  const arr = [...unusedQuotes.value];
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  displayQuotes.value = arr.map((q, i) => ({ ...q, _displayIndex: i + 1 }));
  // 短暂动画
  setTimeout(() => { shuffling.value = false; }, 300);
};

const shuffleQuotes = () => {
  shuffleDisplay();
};

// 打开选用弹窗
const openSelectDialog = (quote) => {
  selectDialog.quote = quote;
  selectDialog.link = "";
  selectDialog.visible = true;
};

// 确认选用
const confirmSelect = async () => {
  selectDialog.loading = true;
  try {
    await api.put(`/daily-quote/${selectDialog.quote.id}/use`, {
      link: selectDialog.link,
    });
    ElMessage.success("选用成功！");
    selectDialog.visible = false;
    await fetchQuotes();
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "选用失败");
  } finally {
    selectDialog.loading = false;
  }
};

const deleteQuote = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除这条每日一言吗？", "确认删除", { type: "warning" });
    await api.delete(`/daily-quote/${row.id}`);
    ElMessage.success("删除成功");
    await fetchQuotes();
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err.response?.data?.message || "删除失败");
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
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
.quote-list-card,
.quote-cards-section {
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

.section-title-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary, #303133);
}

/* ========== 工具栏 ========== */
.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

/* ========== 卡片网格 ========== */
.quote-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}

.quote-card {
  position: relative;
  padding: 20px 18px 14px;
  border-radius: 10px;
  background: var(--card-bg, #fff);
  border: 1.5px solid var(--card-border, #e4e7ed);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.quote-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  border-color: #409eff;
}

.quote-card-index {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  color: #c0c4cc;
  font-weight: 600;
}

.quote-card-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary, #303133);
  margin: 0 0 14px 0;
  min-height: 50px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quote-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary, #909399);
}

.quote-card-author {
  font-style: italic;
}

.quote-card-date {
  color: #c0c4cc;
}

/* ========== 选用弹窗 ========== */
.dialog-quote-preview {
  padding: 20px 16px;
  background: linear-gradient(135deg, #f0f5ff, #f5f0ff);
  border-radius: 10px;
  font-size: 18px;
  line-height: 1.8;
  text-align: center;
  color: var(--text-primary, #303133);
  border-left: 4px solid #409eff;
}

.dialog-quote-mark {
  color: #409eff;
  font-size: 24px;
  font-weight: bold;
}

.form-tip {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin-top: -8px;
  display: block;
}

.no-link {
  color: var(--text-secondary, #c0c4cc);
}

.used-section {
  margin-top: 8px;
}
</style>
