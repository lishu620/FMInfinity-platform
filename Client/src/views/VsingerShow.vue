<template>
  <div class="page-container">
    <h1 class="page-title">歌姬列表</h1>

    <!-- 歌姬列表（公共查询，只读） -->
    <div class="section">
      <h2 class="section-title">全部歌姬</h2>
      <el-table :data="vsingerList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="vsingerName" label="歌姬名称" />

        <!-- 歌曲数 -->
        <el-table-column label="歌曲数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" round>{{ row.songCount || 0 }}</el-tag>
          </template>
        </el-table-column>

        <!-- 操作：仅保留查看歌曲 -->
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="openSongList(row)">
              查看歌曲
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 歌姬歌曲统计弹窗 -->
    <el-dialog
      v-model="songDialogVisible"
      title="歌姬参与歌曲统计"
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
import { ElMessage } from "element-plus";

// 列表
const vsingerList = ref([]);

// 歌曲统计
const songDialogVisible = ref(false);
const currentVsinger = ref(null);
const songCount = ref(0);
const songList = ref([]);

// 获取歌姬列表（带歌曲数）
const fetchVsingers = async () => {
  try {
    const { data } = await api.get("/vsingers");
    vsingerList.value = data;
  } catch (err) {
    ElMessage.error("获取歌姬失败");
  }
};

// 查看歌曲
const openSongList = async (row) => {
  currentVsinger.value = row;
  songDialogVisible.value = true;
  songCount.value = 0;
  songList.value = [];

  try {
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
