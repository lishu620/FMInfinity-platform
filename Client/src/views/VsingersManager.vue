<template>
  <div class="vsingers-management">
    <h1 class="title">歌姬管理</h1>

    <!-- 新增 + 批量导入 -->
    <div class="section">
      <h2 class="section-title">新增 / 批量导入</h2>
      <el-card>
        <el-tabs>
          <!-- 单个新增 -->
          <el-tab-pane label="单个新增" name="single">
            <el-form @submit.prevent="createVsinger" label-width="80px">
              <el-form-item label="歌姬名">
                <el-input
                  v-model="newVsinger.vsingerName"
                  placeholder="请输入歌姬名称"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" native-type="submit"
                  >新增歌姬</el-button
                >
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 批量导入 -->
          <el-tab-pane label="批量导入" name="batch">
            <el-form @submit.prevent="batchImport" label-width="80px">
              <el-form-item label="歌姬列表">
                <el-input
                  v-model="importText"
                  type="textarea"
                  :rows="6"
                  placeholder="请粘贴用 、 分隔的歌姬名称，例如：洛天依、言和、乐正绫、星尘"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" native-type="submit"
                  >一键批量导入</el-button
                >
                <el-button @click="importText = ''">清空</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 歌姬列表 -->
    <div class="section">
      <h2 class="section-title">歌姬列表</h2>
      <el-table :data="vsingerList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="vsingerName" label="歌姬名称" />
        <el-table-column label="歌曲数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" round>{{ row.songCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <!-- 所有人都能看歌曲列表 -->
            <el-button size="small" type="success" @click="openSongList(row)">
              查看歌曲
            </el-button>

            <!-- 仅超管显示 编辑 + 删除 -->
            <el-button
              size="small"
              type="primary"
              @click="editVsinger(row)"
              v-if="authStore.isSuperAdmin"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteVsinger(row.id)"
              v-if="authStore.isSuperAdmin"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑歌姬" width="500px">
      <el-form label-width="80px">
        <el-form-item label="歌姬名">
          <el-input v-model="editingVsinger.vsingerName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="updateVsinger">确定</el-button>
      </template>
    </el-dialog>

    <!-- 歌姬歌曲统计弹窗 -->
    <el-dialog
      v-model="songDialogVisible"
      title="歌姬被选歌曲统计"
      width="700px"
    >
      <div v-if="currentVsinger" class="mb-4">
        <h3>歌姬：{{ currentVsinger.vsingerName }}</h3>
        <h3>已参与：{{ songCount }} 首歌曲</h3>
      </div>

      <el-table v-if="songList.length > 0" :data="songList" style="width: 100%">
        <el-table-column prop="name" label="歌曲名" />
        <el-table-column prop="Issue.title" label="所属稿件" />
        <el-table-column prop="createdAt" label="选择时间" />
      </el-table>

      <div v-else class="text-center p-4">暂无歌曲</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/store/auth";
import { useAuthStore } from "@/store/auth";
import { ElMessage, ElMessageBox } from "element-plus";

const authStore = useAuthStore();

// 列表
const vsingerList = ref([]);

// 单个新增
const newVsinger = ref({ vsingerName: "" });

// 批量导入
const importText = ref("");

// 编辑
const editingVsinger = ref({ id: null, vsingerName: "" });
const editVisible = ref(false);

// 歌姬歌曲统计
const songDialogVisible = ref(false);
const currentVsinger = ref(null);
const songCount = ref(0);
const songList = ref([]);

// 获取歌姬列表
const fetchVsingers = async () => {
  try {
    const { data } = await api.get("/vsingers");
    vsingerList.value = data;
  } catch (err) {
    ElMessage.error("获取歌姬失败");
  }
};

// 新增
const createVsinger = async () => {
  try {
    await api.post("/vsingers", newVsinger.value);
    ElMessage.success("新增成功");
    newVsinger.value = { vsingerName: "" };
    fetchVsingers();
  } catch (err) {
    ElMessage.error("新增失败");
  }
};

// 批量导入
const batchImport = async () => {
  try {
    const res = await api.post("/vsingers/batch-import", {
      text: importText.value,
    });
    ElMessage.success(res.data.message);
    fetchVsingers();
  } catch (err) {
    ElMessage.error("导入失败");
  }
};

// 编辑
const editVsinger = (row) => {
  editingVsinger.value = { ...row };
  editVisible.value = true;
};

// 更新
const updateVsinger = async () => {
  try {
    await api.put(`/vsingers/${editingVsinger.value.id}`, editingVsinger.value);
    ElMessage.success("更新成功");
    editVisible.value = false;
    fetchVsingers();
  } catch (err) {
    ElMessage.error("更新失败");
  }
};

// 删除
const deleteVsinger = async (id) => {
  try {
    await ElMessageBox.confirm("确定删除该歌姬吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await api.delete(`/vsingers/${id}`);
    ElMessage.success("删除成功");
    fetchVsingers();
  } catch {
    ElMessage.info("已取消");
  }
};

// 打开歌姬歌曲统计
const openSongList = async (row) => {
  currentVsinger.value = row;
  songDialogVisible.value = true;
  songCount.value = 0;
  songList.value = [];

  try {
    // 🔥 修复：去掉 /api/ 前缀（和你其他接口一致）
    const { data: countData } = await api.get(`/vsingers/${row.id}/song-count`);
    songCount.value = countData.count;

    const { data: songData } = await api.get(`/vsingers/${row.id}/songs`);
    songList.value = songData;
  } catch (err) {
    ElMessage.error("获取歌曲数据失败");
  }
};

onMounted(() => {
  fetchVsingers();
});
</script>

<style scoped>
.vsingers-management {
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
.text-center {
  text-align: center;
}
.p-4 {
  padding: 16px;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
