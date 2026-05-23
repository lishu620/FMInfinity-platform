<template>
  <div class="page-container">
    <h1 class="page-title">稿件查看 / 文案编辑</h1>
    <p class="tip">超管可统筹分配，文案组可认领并填写文案</p>

    <div class="issue-list">
      <div
        class="issue-card"
        v-for="issue in reviewIssues"
        :key="issue.id"
        @click="openReviewModal(issue)"
      >
        <div class="title">{{ issue.title }}</div>
        <div class="status status-ing">{{ statusText(issue.status) }}</div>
        <div class="desc">
          本期选择 {{ issue.selectedCount || 0 }} 首 → 点击查看文案
        </div>
      </div>

      <div class="empty" v-if="reviewIssues.length === 0">暂无可查看稿件</div>
    </div>

    <el-dialog
      v-model="reviewModalVisible"
      :title="
        currentIssue.title ? `${currentIssue.title} - 稿件查看` : '稿件查看'
      "
      width="1400px"
      :close-on-click-modal="false"
      :before-close="handleDialogClose"
    >
      <div class="toolbar" v-if="canManage">
        <el-select
          v-model="selectedSongIdForReview"
          placeholder="选择要加入稿件页的歌曲"
          style="width: 320px"
          filterable
        >
          <el-option
            v-for="song in notInReviewSongs"
            :key="song.id"
            :label="`${song.name}${song.submitter ? `（${song.submitter}）` : ''}`"
            :value="song.id"
          />
        </el-select>
        <el-button type="success" @click="addReviewSong">
          加入稿件页
        </el-button>
      </div>

      <div v-if="currentSongs.length === 0" class="empty-box">
        当前没有进入稿件页的歌曲
      </div>

      <div
        v-else
        class="song-review-card"
        v-for="song in currentSongs"
        :key="song.id"
      >
        <div class="card-body">
          <div class="info-side">
            <div class="votes-badge">总票数：{{ song.totalVotes || 0 }}</div>

            <div class="song-name">{{ song.name }}</div>
            <div class="song-meta">歌手：{{ song.artist || "未知" }}</div>
            <div class="song-meta">提交者：{{ song.submitter || "未知" }}</div>
            <div class="song-meta">平台：{{ song.type || "暂无" }}</div>
            <div class="song-meta">
              当前文案作者：{{ song.copy?.nickname || "未分配" }}
            </div>
            <div class="song-meta">
              文案状态：
              <span v-if="song.copy?.isSubmitted">已提交</span>
              <span v-else>未提交</span>
            </div>

            <div class="action-row">
              <el-button
                v-if="canClaim(song)"
                type="primary"
                @click="claimSong(song)"
              >
                认领文案
              </el-button>

              <el-button
                v-if="canManage"
                type="warning"
                @click="openAssignDialog(song)"
              >
                指定老师
              </el-button>

              <el-button
                v-if="canManage"
                type="danger"
                plain
                @click="removeReviewSong(song)"
              >
                移出稿件页
              </el-button>
            </div>
          </div>

          <div class="editor-side">
            <el-input
              v-model="draftMap[song.id]"
              type="textarea"
              :rows="10"
              placeholder="请输入推荐文案"
              :disabled="!canEdit(song)"
            />

            <div class="editor-actions" v-if="canEdit(song)">
              <el-button @click="saveCopy(song, false)">保存草稿</el-button>
              <el-button type="success" @click="saveCopy(song, true)">
                提交文案
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align: right; margin-top: 16px">
        <el-button @click="reviewModalVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="assignDialogVisible"
      title="指定老师写文案"
      width="500px"
    >
      <el-select
        v-model="assignUserId"
        placeholder="选择老师"
        style="width: 100%"
      >
        <el-option
          v-for="u in allUsers"
          :key="u.id"
          :label="`${u.nickname} (${u.username})`"
          :value="u.id"
        />
      </el-select>

      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="assignCopyUser">确认指定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/store/auth";
import api from "@/store/auth";

const authStore = useAuthStore();

const reviewIssues = ref([]);
const reviewModalVisible = ref(false);

const currentIssue = ref({});
const currentSongs = ref([]);
const allSongs = ref([]);
const draftMap = ref({});

const selectedSongIdForReview = ref(null);

const assignDialogVisible = ref(false);
const assignSongId = ref(null);
const assignUserId = ref(null);
const allUsers = ref([]);

const isCopyTeam = computed(() => authStore.user?.group === "文案组");
const canManage = computed(() => authStore.isSuperAdmin);

const statusText = (status) => {
  const map = {
    draft: "草稿",
    submitting: "提交中",
    voting: "投票中",
    confirmed: "已确认",
    published: "已发布",
  };
  return map[status] || status || "-";
};

const updateSelectedCount = async () => {
  try {
    await api.put(`/issue/${currentIssue.value.id}/selected-count`, {
      count: currentIssue.value.selectedCount,
    });

    ElMessage.success("设置成功");
  } catch (err) {
    console.error(err);
    ElMessage.error("设置失败");
    await Promise.all([
      fetchAllSongs(currentIssue.value.id),
      fetchReview(currentIssue.value.id),
    ]);
  }
};

// 自动选歌函数
const selectTopSongsByVote = async (selectedCount) => {
  try {
    console.log("1. 开始获取票数");
    const { data } = await api.get(
      `/issue/${currentIssue.value.id}/songs/vote-count`,
    );

    console.log("2. 获取票数成功", data);
    const topSongs = data
      .sort((a, b) => Number(b.voteCount) - Number(a.voteCount))
      .slice(0, selectedCount);

    console.log("3. 准备提交最终歌曲", topSongs);
    await api.post(`/issue/${currentIssue.value.id}/finalize-songs`, {
      topSongs,
    });

    console.log("4. finalize-songs 成功");
    ElMessage.success(`已自动选择 ${selectedCount} 首歌曲`);

    console.log("5. 开始 fetchSongs");
    await Promise.all([
      fetchAllSongs(currentIssue.value.id),
      fetchReview(currentIssue.value.id),
    ]);
    console.log("6. fetchSongs 成功");
  } catch (err) {
    console.error("selectTopSongsByVote 出错：", err);
    ElMessage.error("自动选歌失败");
  }
};

const notInReviewSongs = computed(() => {
  const reviewIds = new Set(currentSongs.value.map((s) => s.id));
  return allSongs.value.filter((s) => !reviewIds.has(s.id)); // 只显示未加入稿件的歌曲
});

const canClaim = (song) => {
  return isCopyTeam.value && !song.copy;
};

const canEdit = (song) => {
  if (authStore.isSuperAdmin) return true;
  if (!song.copy) return false;
  return song.copy.userId === authStore.user?.id;
};

const loadReviewIssues = async () => {
  try {
    const res = await api.get("/issue/review-list");
    reviewIssues.value = res.data || [];
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "加载稿件列表失败");
  }
};

const fetchAllSongs = async (issueId) => {
  const res = await api.get(`/issue/${issueId}/songs`);
  allSongs.value = res.data || [];
};

const fetchReview = async (issueId) => {
  const res = await api.get(`/issue/${issueId}/review`);
  currentIssue.value = res.data.issue || {};
  currentSongs.value = res.data.songs || [];

  const nextDraftMap = {};
  currentSongs.value.forEach((song) => {
    nextDraftMap[song.id] = song.copy?.content || "";
  });
  draftMap.value = nextDraftMap;
};

const fetchAllUsers = async () => {
  try {
    const res = await api.get("/auth/group/users");
    allUsers.value = res.data || [];
  } catch (e) {
    allUsers.value = [];
  }
};

const openReviewModal = async (issue) => {
  currentIssue.value = issue;
  reviewModalVisible.value = true;
  selectedSongIdForReview.value = null;

  try {
    (fetchAllSongs(issue.id), fetchReview(issue.id));
  } catch (e) {
    console.error(e);
    ElMessage.error("加载稿件数据失败");
  }
};

const claimSong = async (song) => {
  try {
    await api.post(`/issue/${currentIssue.value.id}/copy/claim`, {
      songId: song.id,
    });
    ElMessage.success("认领成功");
    await fetchReview(currentIssue.value.id);
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "认领失败");
  }
};

const saveCopy = async (song, isSubmitted = false) => {
  try {
    await api.put(`/issue/${currentIssue.value.id}/copy/${song.id}`, {
      content: draftMap.value[song.id],
      isSubmitted,
    });
    ElMessage.success(isSubmitted ? "提交成功" : "保存成功");
    await fetchReview(currentIssue.value.id);
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "保存失败");
  }
};

const addReviewSong = async () => {
  if (!selectedSongIdForReview.value) {
    return ElMessage.warning("请选择歌曲");
  }

  try {
    await api.post(`/issue/${currentIssue.value.id}/review-song`, {
      songId: selectedSongIdForReview.value,
    });
    ElMessage.success("已加入稿件页");
    selectedSongIdForReview.value = null;
    await Promise.all([
      fetchAllSongs(currentIssue.value.id),
      fetchReview(currentIssue.value.id),
    ]);
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "加入失败");
  }
};

const removeReviewSong = async (song) => {
  try {
    await ElMessageBox.confirm(`确定将《${song.name}》移出稿件页吗？`, "提示", {
      type: "warning",
    });

    await api.delete(`/issue/${currentIssue.value.id}/review-song/${song.id}`);
    ElMessage.success("已移出");
    await Promise.all([
      fetchAllSongs(currentIssue.value.id),
      fetchReview(currentIssue.value.id),
    ]);
  } catch (e) {
    if (e !== "cancel") {
      console.error(e);
      ElMessage.error(e?.response?.data?.message || "移出失败");
    }
  }
};

const openAssignDialog = async (song) => {
  assignSongId.value = song.id;
  assignUserId.value = null;
  await fetchAllUsers();
  assignDialogVisible.value = true;
};

const assignCopyUser = async () => {
  if (!assignSongId.value) return ElMessage.warning("未选择歌曲");
  if (!assignUserId.value) return ElMessage.warning("请选择老师");

  try {
    await api.post(`/issue/${currentIssue.value.id}/copy/assign`, {
      songId: assignSongId.value,
      userId: assignUserId.value,
    });
    ElMessage.success("指定成功");
    assignDialogVisible.value = false;
    await fetchReview(currentIssue.value.id);
  } catch (e) {
    console.error(e);
    ElMessage.error(e?.response?.data?.message || "指定失败");
  }
};

const handleDialogClose = (done) => {
  currentIssue.value = {};
  currentSongs.value = [];
  allSongs.value = [];
  draftMap.value = {};
  selectedSongIdForReview.value = null;
  assignDialogVisible.value = false;
  assignSongId.value = null;
  assignUserId.value = null;
  done();
};

onMounted(() => {
  loadReviewIssues();
});
</script>

<style scoped>
.issue-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.issue-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.issue-card:hover {
  background: #e6f7ff;
}

.title {
  font-weight: bold;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  margin: 6px 0;
  display: inline-block;
}

.status-ing {
  background: #409eff;
}

.desc {
  color: #999;
  font-size: 13px;
}

.empty {
  grid-column: 1/-1;
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-box {
  text-align: center;
  padding: 40px;
  color: #999;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.song-review-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.card-body {
  display: flex;
  gap: 24px;
}

.info-side {
  width: 360px;
}

.editor-side {
  flex: 1;
}

.votes-badge {
  background: #9f7aea;
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  display: inline-block;
}

.song-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.song-meta {
  color: #666;
  margin-bottom: 8px;
}

.action-row {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}
</style>
